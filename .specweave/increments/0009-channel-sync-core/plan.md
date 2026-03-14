# Implementation Plan: Channel Sync Core (T-001 to T-011)

## Execution Order

### Phase A: Schema & Encryption (T-001, T-002)
1. **T-001**: Add ChannelType, SyncStatus enums + ChannelConnection, SyncLog models to Prisma schema. Add `channelConnections` relation to User. Run migration.
2. **T-002**: Create CredentialEncryptionService with AES-256-GCM encrypt/decrypt. Unit tests for round-trip, nonce uniqueness, wrong key, missing env.

### Phase B: Core Services (T-003, T-004, T-005)
3. **T-003**: ChannelConnectionService CRUD. Encrypts tokens on create, never exposes tokens in DTOs. Create ChannelsModule.
4. **T-004**: SyncDispatcher with `@Cron(EVERY_MINUTE)`, isDue() check, concurrency guard Set, triggerNow() for manual sync.
5. **T-005**: SyncExecutor orchestration: create SyncLog(RUNNING), decrypt tokens, call adapter, upsert orders, update SyncLog. Retry with exponential backoff. Define ChannelAdapter interface + error classes (RateLimitError, AuthExpiredError, NetworkError, MappingError).

### Phase C: Shopee Adapter (T-006, T-007)
6. **T-006**: ShopeeAdapter OAuth: getOAuthUrl(), exchangeCode(), HMAC-SHA256 signing.
7. **T-007**: ShopeeAdapter fetchOrders with pagination, token refresh, rate-limit handling.

### Phase D: OAuth + Mapping + Admin (T-008, T-009, T-010, T-011)
8. **T-008**: OAuthController + OAuthService: state generation/validation, GET /channels/oauth/:channel redirect, GET /channels/oauth/callback.
9. **T-009**: OrderMapper: mapShopeeOrder() mapping all fields, mapShopeeStatus() for status mapping.
10. **T-010**: SyncExecutor order upsert: Prisma upsert with channel+externalOrderId, track created/updated counts.
11. **T-011**: AdminChannelsController: POST /:id/sync (manual trigger), PATCH /:id (settings update), wired with AdminGuard.

## File Structure

```
apps/api/src/channels/
├── channels.module.ts
├── channel-connection.service.ts
├── adapters/
│   ├── channel-adapter.interface.ts
│   └── shopee.adapter.ts
├── encryption/
│   └── credential-encryption.service.ts
├── sync/
│   ├── sync-dispatcher.service.ts
│   ├── sync-executor.service.ts
│   ├── order-mapper.service.ts
│   └── errors.ts
├── oauth/
│   ├── oauth.controller.ts
│   └── oauth.service.ts
apps/api/src/admin/channels/
├── admin-channels.module.ts
├── admin-channels.controller.ts
└── admin-channels.service.ts
```

## Module Wiring

- `ChannelsModule` imports `ScheduleModule.forRoot()`, provides all channel services, exports ChannelConnectionService + SyncDispatcher
- `AdminChannelsModule` imports `ChannelsModule`, provides AdminChannelsService + AdminChannelsController
- `AdminModule` imports `AdminChannelsModule`
- `AppModule` imports `ChannelsModule`

## Testing Approach

- Unit tests: vitest with `vi.mock('@shopvui/db')` for prisma, manual construction of services (no NestJS DI in tests — matching existing codebase pattern)
- Each service gets a `.spec.ts` file with the test cases specified in master tasks.md
