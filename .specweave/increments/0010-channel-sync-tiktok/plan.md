# Plan: Channel Sync - TikTok Backend

## Analysis of Upstream State

After reading all upstream contracts, several tasks are already fully or partially complete:

### Already Complete (verify only)
- **T-012**: Shopee status mapping is implemented in `OrderMapperService.mapShopeeStatus()` with full test coverage in `order-mapper.service.spec.ts`
- **T-013**: TikTok status mapping is implemented in `OrderMapperService.mapTikTokStatus()` with full test coverage
- **T-018**: Admin GET /admin/channels and GET /admin/channels/:id/logs are implemented in `AdminChannelsController` with tests
- **T-021**: Error types (RateLimitError, AuthExpiredError, NetworkError, MappingError) are in `errors.ts`. SyncExecutor already handles them and writes structured error logs. Tests exist in `sync-executor.service.spec.ts`

### Needs Implementation
- **T-014**: TikTokAdapter - OAuth flow (getOAuthUrl, exchangeCode)
- **T-015**: TikTokAdapter - Token refresh + fetchOrders with rate-limit handling
- **T-016**: Add `mapTikTokOrder()` method to OrderMapperService + tests
- **T-017**: Register TikTokAdapter in ChannelsModule, integration test
- **T-022**: SyncLogCleanupService - 30-day retention cron job

## Implementation Order

1. **T-016**: Add `mapTikTokOrder()` to OrderMapperService (needed by TikTokAdapter tests)
2. **T-014 + T-015**: Create TikTokAdapter (OAuth + fetchOrders + token refresh)
3. **T-017**: Register in ChannelsModule + integration test
4. **T-022**: SyncLogCleanupService

## Patterns to Follow

- Mirror ShopeeAdapter structure exactly (constructor with ConfigService + ConnectionService, httpGet/httpPost methods, sign method)
- Use same test patterns (vi.mock, mockConfigService, mockConnectionService)
- TikTok API uses `https://auth.tiktok-shops.com` for OAuth, `https://open-api.tiktokglobalshop.com` for data APIs
- TikTok signing: HMAC-SHA256 of sorted param string
- TikTok pagination: cursor-based with `next_page_token`
- TikTok rate limit error code: `40029`

## Files to Create/Modify

### Create
- `apps/api/src/channels/adapters/tiktok.adapter.ts`
- `apps/api/src/channels/adapters/tiktok.adapter.spec.ts`
- `apps/api/src/channels/sync/sync-log-cleanup.service.ts`
- `apps/api/src/channels/sync/sync-log-cleanup.service.spec.ts`
- `apps/api/src/channels/sync/tiktok-sync.integration.spec.ts`

### Modify
- `apps/api/src/channels/sync/order-mapper.service.ts` (add mapTikTokOrder)
- `apps/api/src/channels/sync/order-mapper.service.spec.ts` (add TikTok order mapping tests)
- `apps/api/src/channels/channels.module.ts` (register TikTokAdapter + SyncLogCleanupService)
