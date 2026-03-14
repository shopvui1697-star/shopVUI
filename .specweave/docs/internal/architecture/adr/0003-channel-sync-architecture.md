# ADR-0003: Channel API Sync Architecture

## Status
Accepted

## Date
2026-03-12

## Context
ShopVui needs to sync orders from external sales channels (Shopee, TikTok Shop) via their REST APIs. Currently, external orders only enter via manual CSV import. We need automated polling-based sync with OAuth credential management, rate limiting, and a channel abstraction that supports adding future platforms (e.g., Facebook Commerce).

Key constraints:
- NestJS monolith (no separate worker process) -- job scheduling must work within the NestJS process
- Single PostgreSQL database via Prisma -- no Redis available yet
- Small scale: 50-200 orders/day per shop, 1-5 connected shops
- Shopee rate limits: ~1 req/sec, 10,000/day. TikTok: similar per-app limits
- OAuth tokens expire (Shopee: 4 hours, TikTok: varies) and must be refreshed automatically

## Decisions

### D1: Strategy Pattern for Channel Adapters
Use a `ChannelAdapter` interface with `ShopeeAdapter` and `TiktokAdapter` implementations. Each adapter encapsulates: OAuth flow URLs, token exchange, token refresh, order fetching, and order-to-ShopVui mapping.

**Why not a generic HTTP adapter with config?** Shopee and TikTok have significantly different auth flows (Shopee uses partner-level signing with timestamps; TikTok uses standard OAuth2 with HMAC signatures), different API shapes, different pagination, and different rate-limit headers. A generic adapter would need so many config options it would be harder to maintain than two focused implementations.

**Interface**:
```typescript
interface ChannelAdapter {
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<TokenPair>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  fetchOrders(accessToken: string, shopId: string, since: Date): Promise<ExternalOrder[]>;
  mapOrder(external: ExternalOrder): MappedOrder;
}
```

### D2: NestJS @nestjs/schedule (cron) for Background Jobs
Use `@nestjs/schedule` with `@Cron()` decorators for the sync scheduler. A single cron job runs every minute, queries enabled connections, and dispatches sync work for connections whose interval has elapsed.

**Why not BullMQ?** BullMQ requires Redis, which is not in the current stack. The scale (1-5 shops, polling every 5-15 min) does not justify adding Redis infrastructure. If scale grows beyond ~50 shops or we need webhook processing, migrate to BullMQ then.

**Why not per-connection dynamic cron?** NestJS cron decorators are static. Instead, a single "dispatcher" cron runs every minute and checks `lastSyncAt + syncIntervalMinutes` for each connection. This avoids dynamic cron registration complexity while supporting per-shop intervals.

**Concurrency guard**: An in-memory `Set<connectionId>` prevents overlapping syncs. The set is checked before starting and cleared on completion (success or failure). This is sufficient for single-process deployment.

### D3: AES-256-GCM Encryption for Stored Tokens
Encrypt access_token and refresh_token using AES-256-GCM before storing in PostgreSQL. The encryption key is provided via `CHANNEL_ENCRYPTION_KEY` environment variable (32-byte hex string). Each encrypted value stores the IV alongside the ciphertext.

**Why not application-level encryption library (e.g., bcrypt)?** Bcrypt is one-way hashing; we need reversible encryption to use the tokens. AES-256-GCM provides both confidentiality and integrity verification.

**Why not database-level encryption (pgcrypto)?** Keeping encryption in the application layer means the database never sees plaintext tokens, even in query logs. It also makes the encryption portable across database providers.

### D4: New Prisma Models -- ChannelConnection and SyncLog
Two new models under the existing schema:

**ChannelConnection**: Stores shop credentials and sync configuration. One row per connected shop. Links to User (the admin who connected it).

**SyncLog**: Append-only log of each sync execution. Links to ChannelConnection. Used for admin UI monitoring and debugging. Cleaned up after 30 days by a scheduled job.

### D5: Admin Module Placement (Consistent with ADR-0002)
Channel management endpoints go under `apps/api/src/admin/channels/` with prefix `/admin/channels/*`, following the established admin module pattern from ADR-0002. The sync engine itself lives at `apps/api/src/channels/` as a non-admin module (it runs background jobs, not just admin endpoints).

### D6: OAuth Callback as Non-Admin Endpoint
The OAuth callback endpoint (`/channels/oauth/callback`) must be accessible without AdminGuard because it receives redirects from Shopee/TikTok. Instead, it validates using a `state` parameter (CSRF token stored in the database before redirect) to associate the callback with the originating admin session.

## Consequences
- Two new Prisma models require a migration
- `CHANNEL_ENCRYPTION_KEY` must be provisioned in all environments
- `@nestjs/schedule` package added as a dependency
- Channel module is the first non-admin module that runs background jobs
- Future channels (Facebook, Lazada) implement `ChannelAdapter` interface
- No Redis dependency; if BullMQ is needed later, the adapter pattern makes migration straightforward since the sync logic is already decoupled from the scheduling mechanism
