# Implementation Plan: Channel API Sync

## Overview

Add automated order sync from Shopee and TikTok Shop APIs to ShopVui. The architecture uses a **Strategy pattern** for channel adapters, **NestJS @nestjs/schedule** for background polling, **AES-256-GCM** for credential encryption, and two new Prisma models (ChannelConnection, SyncLog). The system polls each connected shop at configurable intervals (5-15 min), maps external orders to the unified Order model, and provides admin UI for connection management and sync monitoring.

**ADR**: `.specweave/docs/internal/architecture/adr/0003-channel-sync-architecture.md`

## Architecture

### Component Diagram

```
apps/api/src/
├── channels/                          # Core sync engine (non-admin)
│   ├── channels.module.ts             # Imports ScheduleModule, provides all channel services
│   ├── adapters/
│   │   ├── channel-adapter.interface.ts   # ChannelAdapter interface + types
│   │   ├── shopee.adapter.ts              # Shopee API implementation
│   │   └── tiktok.adapter.ts              # TikTok API implementation
│   ├── encryption/
│   │   └── credential-encryption.service.ts  # AES-256-GCM encrypt/decrypt
│   ├── sync/
│   │   ├── sync-dispatcher.service.ts     # Cron: every 1 min, dispatches due syncs
│   │   ├── sync-executor.service.ts       # Runs a single sync for one connection
│   │   └── order-mapper.service.ts        # Maps external orders -> ShopVui Order
│   ├── oauth/
│   │   ├── oauth.controller.ts            # GET /channels/oauth/:channel (redirect)
│   │   │                                  # GET /channels/oauth/callback (receive code)
│   │   └── oauth.service.ts               # State generation, code exchange, token storage
│   └── channel-connection.service.ts      # CRUD for ChannelConnection records
│
├── admin/channels/                    # Admin API for channel management
│   ├── admin-channels.module.ts
│   ├── admin-channels.controller.ts   # /admin/channels/* endpoints
│   └── admin-channels.service.ts      # Delegates to channels/ services
```

### Data Flow

```
1. CONNECT:  Admin -> /admin/channels/connect/shopee -> Redirect to Shopee OAuth
             Shopee -> /channels/oauth/callback?code=X&state=Y -> Exchange token
             -> Encrypt tokens -> Save ChannelConnection

2. SYNC:     SyncDispatcher (every 1 min) -> Check due connections
             -> SyncExecutor.run(connection)
                -> Decrypt tokens
                -> ChannelAdapter.fetchOrders(since lastSyncAt)
                -> OrderMapper.map(externalOrders)
                -> Upsert orders (dedup by externalOrderId + channel)
                -> Update lastSyncAt, log SyncLog entry

3. REFRESH:  Before fetchOrders, check tokenExpiresAt
             -> If expired, ChannelAdapter.refreshToken()
             -> Encrypt new tokens -> Update ChannelConnection

4. MONITOR:  Admin -> /admin/channels -> List connections + status
             Admin -> /admin/channels/:id/logs -> Paginated SyncLog entries
             Admin -> /admin/channels/:id/sync -> Manual trigger
```

### Data Model

#### ChannelConnection (new)
```prisma
enum ChannelType {
  SHOPEE
  TIKTOK
}

enum SyncStatus {
  IDLE
  RUNNING
  SUCCESS
  FAILED
}

model ChannelConnection {
  id                    String      @id @default(cuid())
  channel               ChannelType
  shopId                String      @map("shop_id")        // External platform shop ID
  shopName              String      @map("shop_name")
  encryptedAccessToken  String      @map("encrypted_access_token")
  encryptedRefreshToken String      @map("encrypted_refresh_token")
  tokenExpiresAt        DateTime    @map("token_expires_at")
  syncEnabled           Boolean     @default(true) @map("sync_enabled")
  syncIntervalMinutes   Int         @default(10) @map("sync_interval_minutes")
  lastSyncAt            DateTime?   @map("last_sync_at")
  lastSyncStatus        SyncStatus  @default(IDLE) @map("last_sync_status")
  createdById           String      @map("created_by_id")
  createdBy             User        @relation(fields: [createdById], references: [id])
  syncLogs              SyncLog[]
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")

  @@unique([channel, shopId])
  @@map("channel_connections")
}
```

#### SyncLog (new)
```prisma
model SyncLog {
  id                  String            @id @default(cuid())
  channelConnectionId String            @map("channel_connection_id")
  channelConnection   ChannelConnection @relation(fields: [channelConnectionId], references: [id], onDelete: Cascade)
  status              SyncStatus
  ordersFetched       Int               @default(0) @map("orders_fetched")
  ordersCreated       Int               @default(0) @map("orders_created")
  ordersUpdated       Int               @default(0) @map("orders_updated")
  errorType           String?           @map("error_type")     // rate_limit | auth_expired | network_error | mapping_error
  errorMessage        String?           @map("error_message")
  durationMs          Int?              @map("duration_ms")
  startedAt           DateTime          @default(now()) @map("started_at")
  completedAt         DateTime?         @map("completed_at")

  @@index([channelConnectionId])
  @@index([startedAt])
  @@map("sync_logs")
}
```

**User model change**: Add `channelConnections ChannelConnection[]` relation field.

**Order model**: Already has `channel` (String) and `externalOrderId` fields with a composite index. No schema changes needed for orders. Channel values: `"shopee"`, `"tiktok"` (lowercase strings matching existing CSV import convention).

### API Contracts

#### OAuth Flow (Non-Admin, /channels/*)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/channels/oauth/:channel` | Redirect to platform OAuth (requires admin cookie for state association) |
| `GET` | `/channels/oauth/callback` | Receive OAuth code, exchange for tokens, redirect to admin UI |

#### Admin Channel Management (/admin/channels/*)
| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| `GET` | `/admin/channels` | List all connections | - | `ApiResponse<ChannelConnectionDto[]>` |
| `POST` | `/admin/channels/:id/sync` | Trigger manual sync | - | `ApiResponse<{ syncLogId: string }>` |
| `PATCH` | `/admin/channels/:id` | Update sync settings | `{ syncEnabled?, syncIntervalMinutes? }` | `ApiResponse<ChannelConnectionDto>` |
| `DELETE` | `/admin/channels/:id` | Disconnect (delete credentials) | - | `ApiResponse<void>` |
| `GET` | `/admin/channels/:id/logs` | Paginated sync logs | `?page=1&limit=20` | `ApiResponse<PaginatedResponse<SyncLogDto>>` |

#### ChannelConnectionDto (never exposes tokens)
```typescript
interface ChannelConnectionDto {
  id: string;
  channel: 'SHOPEE' | 'TIKTOK';
  shopId: string;
  shopName: string;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  lastSyncStatus: SyncStatus;
  createdAt: string;
}
```

## Technology Stack

- **Scheduling**: `@nestjs/schedule` (wraps `node-cron`) -- no Redis needed
- **Encryption**: Node.js built-in `crypto` module (AES-256-GCM) -- no external lib
- **HTTP Client**: `axios` or Node.js `fetch` for Shopee/TikTok API calls (NestJS already uses axios via HttpModule)
- **Shopee SDK**: Direct HTTP -- Shopee Open Platform uses REST with HMAC-SHA256 signing (no official Node SDK worth using)
- **TikTok SDK**: Direct HTTP -- TikTok Shop Seller API uses REST with HMAC-SHA256 signing

**New dependencies**:
- `@nestjs/schedule` + `cron` (peer dep)

## Architecture Decisions

See ADR-0003 for full rationale. Key decisions:
1. **Strategy pattern** over generic config-driven adapter -- Shopee and TikTok differ too much
2. **@nestjs/schedule** over BullMQ -- no Redis, scale doesn't justify it
3. **AES-256-GCM** in application layer -- DB never sees plaintext tokens
4. **Single dispatcher cron** over dynamic per-connection crons -- simpler, sufficient
5. **In-memory concurrency Set** over DB locks -- single-process deployment
6. **OAuth callback outside AdminGuard** -- validated by state parameter instead

## Implementation Phases

### Phase 1: Foundation (US-006, US-009, FR-001, FR-002)
1. Prisma migration: ChannelConnection and SyncLog models
2. CredentialEncryptionService (AES-256-GCM encrypt/decrypt)
3. ChannelAdapter interface definition
4. ChannelConnectionService (CRUD)
5. SyncDispatcher (cron skeleton) + concurrency guard
6. SyncExecutor (orchestration skeleton)

### Phase 2: Shopee Integration (US-001, US-003, US-005 partial)
1. ShopeeAdapter: OAuth URL generation, code exchange, token refresh
2. ShopeeAdapter: fetchOrders with pagination and rate-limit handling
3. OrderMapper: Shopee order -> ShopVui Order (status mapping per US-005)
4. OAuthController + OAuthService for Shopee flow
5. End-to-end sync test with Shopee adapter

### Phase 3: TikTok Integration (US-002, US-004, US-005 partial)
1. TiktokAdapter: OAuth URL generation, code exchange, token refresh
2. TiktokAdapter: fetchOrders with pagination and rate-limit handling
3. OrderMapper: TikTok order -> ShopVui Order (status mapping per US-005)
4. OAuth flow for TikTok
5. End-to-end sync test with TikTok adapter

### Phase 4: Admin UI & Monitoring (US-007, US-008)
1. AdminChannelsController + AdminChannelsService (all CRUD + manual sync trigger)
2. Admin Channel Settings page (`/admin/channels`)
3. Sync logs viewer with pagination
4. Sync log cleanup job (30-day retention)

## Testing Strategy

**Unit tests** (Vitest):
- CredentialEncryptionService: encrypt/decrypt round-trip, invalid key handling
- ShopeeAdapter.mapOrder / TiktokAdapter.mapOrder: all status mappings from US-005
- OrderMapper: dedup logic, field mapping, edge cases (missing fields, unknown statuses)
- SyncDispatcher: interval calculation, concurrency guard
- Rate-limit backoff logic

**Integration tests** (Vitest + Prisma test DB):
- ChannelConnectionService: CRUD with encrypted tokens
- SyncExecutor: full sync flow with mocked adapter HTTP calls
- OAuth flow: state generation, code exchange, token storage
- Order upsert: create new, update existing, dedup by externalOrderId+channel

**E2E tests** (Playwright):
- Admin connects a channel (mocked OAuth redirect)
- Admin views channel list with sync status
- Admin triggers manual sync
- Admin views sync logs
- Admin disconnects a channel

## Technical Challenges

### Challenge 1: Shopee API Signing
Shopee Open Platform requires HMAC-SHA256 signing of every request using partner_key + path + timestamp + access_token + shop_id. The signature must be computed per-request.
**Solution**: Encapsulate signing in a private `sign()` method within ShopeeAdapter. Unit test the signing logic against known test vectors from Shopee docs.
**Risk**: Shopee occasionally changes signing requirements. Mitigate by logging raw request/response on auth failures for debugging.

### Challenge 2: Token Refresh Race Conditions
If two sync runs (shouldn't happen with concurrency guard, but edge case) both detect an expired token, both might try to refresh, and the second refresh invalidates the first's new token.
**Solution**: The concurrency guard (`Set<connectionId>`) prevents this for same-shop syncs. For the manual-trigger-vs-cron edge case, the guard also applies -- manual sync respects it (spec AC-US9-04).

### Challenge 3: Partial Sync Failures
If the sync fetches 50 orders but fails on order #30 (e.g., mapping error), we risk re-processing orders 1-29 on retry.
**Solution**: Process orders individually within a loop (not a single transaction). Track `lastSyncAt` as the max `updated_at` of successfully processed orders, not the fetch time. Log per-order errors in SyncLog.errorMessage as JSON array. This ensures retry only re-fetches from the last successful point.

### Challenge 4: Order Number Generation for Synced Orders
Synced orders need ShopVui order numbers (SV-YYYYMMDD-XXXX format) but must also preserve the external order ID.
**Solution**: Generate ShopVui order numbers using the existing pattern (same as CSV import: `SV-{date}-{channel}-{sequence}`). Store the external platform's order ID in `externalOrderId`. The composite index `[externalOrderId, channel]` prevents duplicates.

### Challenge 5: PaymentMethod Enum Mismatch
External orders may have payment methods (e.g., ShopeePay, TikTok wallet) not in ShopVui's `PaymentMethod` enum (VNPAY, MOMO, BANK_TRANSFER, COD).
**Solution**: Map all external payment methods to `COD` as a default fallback (consistent with existing CSV import behavior). Store the original payment method string in a new optional `externalPaymentMethod` field on Order, or accept the lossy mapping for now and add enum values in a future increment. Recommend: add `EXTERNAL` to the PaymentMethod enum to distinguish from actual COD orders.

## Domain Skill Delegation

After plan approval, delegate to:
- **`backend:nestjs`** (or general `backend:*`) -- for NestJS module implementation, service wiring, cron setup, Prisma migration
- **`frontend:architect`** -- for the admin Channel Settings page (Next.js App Router, consistent with existing admin UI patterns)
