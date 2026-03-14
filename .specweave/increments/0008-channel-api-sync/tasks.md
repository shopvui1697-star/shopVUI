---
increment: 0008-channel-api-sync
title: Channel API Sync - Shopee & TikTok Shop
generated_by: sw:test-aware-planner
test_mode: TDD
coverage_target: 80
by_user_story:
  US-006: [T-001, T-002]
  US-009: [T-003, T-004, T-005]
  US-001: [T-006, T-007, T-008]
  US-003: [T-009, T-010, T-011]
  US-005: [T-012, T-013]
  US-002: [T-014, T-015]
  US-004: [T-016, T-017]
  US-007: [T-018, T-019, T-020]
  US-008: [T-021, T-022]
total_tasks: 22
completed_tasks: 22
---

# Tasks: Channel API Sync - Shopee & TikTok Shop

---

## User Story: US-006 - Channel Credentials Security

**Linked ACs**: AC-US6-01, AC-US6-02, AC-US6-03
**Tasks**: 2 total, all completed

### T-001: Prisma Schema - ChannelConnection and SyncLog Models

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03
**Status**: [x] completed

**Test Plan**:
- **Given** the Prisma schema is extended with ChannelConnection and SyncLog models
- **When** a migration is generated and applied
- **Then** the tables exist with all required columns, constraints (unique on [channel, shopId]), and indexes

**Test Cases**:
1. **Integration**: `apps/api/src/channels/tests/integration/channel-connection.prisma.test.ts`
   - testChannelConnectionUniqueConstraint(): Creates two connections with same channel+shopId, expects unique violation
   - testSyncLogCascadeDelete(): Deletes a ChannelConnection, asserts SyncLog rows are deleted
   - testEncryptedFieldsStoredAsStrings(): Saves a connection, reads raw DB value, asserts token fields are not plaintext
   - **Coverage Target**: 90%

**Implementation**:
1. Add `ChannelType` and `SyncStatus` enums to `packages/db/prisma/schema.prisma`
2. Add `ChannelConnection` model with all fields per plan.md data model
3. Add `SyncLog` model with cascade delete on channelConnectionId
4. Add `channelConnections ChannelConnection[]` relation to User model
5. Run `pnpm --filter @shopvui/db prisma migrate dev --name add-channel-sync-models`
6. Run integration tests

---

### T-002: CredentialEncryptionService - AES-256-GCM Encrypt/Decrypt

**User Story**: US-006
**Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03
**Status**: [x] completed

**Test Plan**:
- **Given** a plaintext token string and a valid CHANNEL_ENCRYPTION_KEY env var (32-byte hex)
- **When** encrypt() is called then decrypt() is called on the result
- **Then** the round-trip produces the original plaintext and the encrypted value is never the plaintext

**Test Cases**:
1. **Unit**: `apps/api/src/channels/encryption/credential-encryption.service.spec.ts`
   - testEncryptDecryptRoundTrip(): Encrypts a token, decrypts it, asserts equality to original
   - testEncryptedValueDiffersFromPlaintext(): Asserts ciphertext !== plaintext
   - testUniqueIvPerEncryption(): Encrypts same value twice, asserts two different ciphertexts (nonce uniqueness)
   - testDecryptWithWrongKeyThrows(): Passes wrong key, expects decryption error
   - testMissingEnvKeyThrows(): Unsets CHANNEL_ENCRYPTION_KEY, expects module init error
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/channels/encryption/credential-encryption.service.ts`
2. Implement `encrypt(plaintext: string): string` using `crypto.createCipheriv('aes-256-gcm', key, iv)`, return `iv:authTag:ciphertext` as base64 joined string
3. Implement `decrypt(ciphertext: string): string` splitting on `:` and using `createDecipheriv`
4. Read `CHANNEL_ENCRYPTION_KEY` from `ConfigService` in constructor; throw if missing or not 32 bytes
5. Export as `@Injectable()` provider in `channels.module.ts`
6. Run unit tests

---

## User Story: US-009 - Background Job Infrastructure

**Linked ACs**: AC-US9-01, AC-US9-02, AC-US9-03, AC-US9-04
**Tasks**: 3 total, all completed

### T-003: ChannelConnectionService - CRUD Operations

**User Story**: US-009
**Satisfies ACs**: AC-US9-01, AC-US9-04
**Status**: [x] completed

**Test Plan**:
- **Given** a ChannelConnection record exists in the DB
- **When** findAllEnabled() is called
- **Then** only connections with syncEnabled=true are returned and token fields are absent from the DTO

**Test Cases**:
1. **Unit**: `apps/api/src/channels/channel-connection.service.spec.ts`
   - testFindAllEnabledFiltersDisabled(): Saves enabled+disabled connections, asserts only enabled returned
   - testCreateConnectionEncryptsTokens(): Calls create() with plaintext tokens, asserts DB stores encrypted values
   - testUpdateConnectionSettings(): Updates syncIntervalMinutes, asserts DB updated
   - testDeleteConnectionRemovesRecord(): Deletes connection, asserts DB empty
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/channels/channel-connection.service.ts` as `@Injectable()`
2. Inject `PrismaService` and `CredentialEncryptionService`
3. Implement `create(dto)`: encrypts accessToken + refreshToken before save, maps to `ChannelConnectionDto` (no tokens)
4. Implement `findAll()`, `findAllEnabled()`, `findById(id)`, `update(id, dto)`, `delete(id)`
5. Implement `toDto(connection): ChannelConnectionDto` - never includes token fields
6. Create `channels.module.ts` wiring PrismaModule, ScheduleModule, EncryptionService, ConnectionService
7. Run unit tests

---

### T-004: SyncDispatcher - Cron Polling with Concurrency Guard

**User Story**: US-009
**Satisfies ACs**: AC-US9-01, AC-US9-03, AC-US9-04
**Status**: [x] completed

**Test Plan**:
- **Given** two enabled connections (one due, one not due based on lastSyncAt + interval)
- **When** the dispatcher's tick() method is called
- **Then** only the due connection is dispatched; a second call while the first is running skips that connection

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/sync-dispatcher.service.spec.ts`
   - testDispatchesDueConnections(): Sets lastSyncAt 15 min ago with 10-min interval, asserts executor called
   - testSkipsNonDueConnections(): Sets lastSyncAt 5 min ago with 10-min interval, asserts executor not called
   - testConcurrencyGuardSkipsDuplicate(): Adds connectionId to running set, asserts second tick skips it
   - testManualTriggerBypassesSchedule(): Calls triggerNow(id), asserts executor called regardless of due time
   - testManualTriggerRespectsGuard(): Adds id to running set, calls triggerNow(id), asserts 409 thrown
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/channels/sync/sync-dispatcher.service.ts`
2. Add `private readonly running = new Set<string>()` for concurrency guard
3. Implement `@Cron(CronExpression.EVERY_MINUTE) tick()`: calls `findAllEnabled()`, filters by isDue(), dispatches via `SyncExecutorService.run(connection)` with guard
4. Implement `isDue(conn): boolean` using `Date.now() - lastSyncAt.getTime() >= syncIntervalMinutes * 60_000`
5. Implement `triggerNow(connectionId: string): Promise<string>` for manual sync (returns syncLogId, throws 409 if already running)
6. Add `@nestjs/schedule` and `cron` packages to `apps/api`
7. Run unit tests

---

### T-005: SyncExecutor - Orchestration with Retry and SyncLog

**User Story**: US-009
**Satisfies ACs**: AC-US9-02, AC-US9-03
**Status**: [x] completed

**Test Plan**:
- **Given** a SyncExecutor running a sync for a connection
- **When** the adapter's fetchOrders() throws a rate-limit error on first attempt
- **Then** it retries with exponential backoff (1s, 2s, 4s) up to 3 times then writes a FAILED SyncLog entry

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/sync-executor.service.spec.ts`
   - testSuccessfulSyncWritesSuccessLog(): Mocks adapter returning 3 orders, asserts SyncLog status=SUCCESS, ordersCreated=3
   - testRetryOnRateLimitError(): Mocks adapter throwing RateLimitError twice then succeeding, asserts 3 total attempts
   - testFailAfterMaxRetriesWritesFailedLog(): Mocks adapter always throwing, asserts SyncLog status=FAILED, errorType='rate_limit'
   - testUpdatesLastSyncAtOnSuccess(): After success, asserts ChannelConnection.lastSyncAt updated
   - testConcurrencyGuardReleasedAfterFailure(): Asserts running Set cleared even when sync throws
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/channels/sync/sync-executor.service.ts`
2. Inject `ChannelConnectionService`, `PrismaService`, adapter registry `Map<ChannelType, ChannelAdapter>`
3. Implement `run(connection)`: create SyncLog(RUNNING), decrypt tokens, call adapter, upsert orders, update SyncLog(SUCCESS)
4. Implement `withRetry(fn, maxRetries=3)`: exponential backoff (1s, 2s, 4s) on RateLimitError and NetworkError
5. On final failure: update SyncLog(FAILED, errorType, errorMessage)
6. Always call `running.delete(connection.id)` in finally block (via dispatcher callback)
7. Create `ChannelAdapter` interface in `adapters/channel-adapter.interface.ts` with `fetchOrders(since: Date)`, `refreshTokenIfNeeded()`, `getOAuthUrl(state)`, `exchangeCode(code)`
8. Run unit tests

---

## User Story: US-001 - Connect Shopee Shop via OAuth

**Linked ACs**: AC-US1-01, AC-US1-02, AC-US1-03, AC-US1-04, AC-US1-05
**Tasks**: 3 total, all completed

### T-006: ShopeeAdapter - OAuth Flow (URL Generation and Code Exchange)

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-04
**Status**: [x] completed

**Test Plan**:
- **Given** a Shopee app_key and redirect_uri configured in env
- **When** getOAuthUrl(state) is called
- **Then** the returned URL contains app_key, redirect_uri, and state query params pointing to Shopee's OAuth endpoint

**Test Cases**:
1. **Unit**: `apps/api/src/channels/adapters/shopee.adapter.spec.ts`
   - testOAuthUrlContainsRequiredParams(): Asserts URL has app_key, redirect_uri, state
   - testExchangeCodeStoresEncryptedTokens(): Mocks Shopee token endpoint, asserts ChannelConnection created with encrypted tokens
   - testExchangeCodeHandlesMultipleShops(): Calls exchange twice for different shopIds, asserts two DB records
   - testHmacSignatureFormat(): Calls a signed request, asserts HMAC-SHA256 signature matches expected format
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/channels/adapters/shopee.adapter.ts` implementing `ChannelAdapter`
2. Inject `ConfigService` for `SHOPEE_APP_KEY`, `SHOPEE_APP_SECRET`, `SHOPEE_REDIRECT_URI`
3. Implement `getOAuthUrl(state)`: build `https://partner.shopeemobile.com/api/v2/shop/auth_partner?...` URL
4. Implement private `sign(path, timestamp)`: HMAC-SHA256 of `appKey + path + timestamp`
5. Implement `exchangeCode(code, shopId)`: POST to Shopee token endpoint, receive access_token/refresh_token/expiry, call `ChannelConnectionService.create()`
6. Register `ShopeeAdapter` in `channels.module.ts`
7. Run unit tests

---

### T-007: ShopeeAdapter - Token Refresh and fetchOrders with Rate-Limit Handling

**User Story**: US-001
**Satisfies ACs**: AC-US1-03, AC-US3-01, AC-US3-04
**Status**: [x] completed

**Test Plan**:
- **Given** a ChannelConnection with tokenExpiresAt in the past
- **When** refreshTokenIfNeeded() is called before fetchOrders
- **Then** the adapter calls Shopee's refresh endpoint, stores new encrypted tokens, and proceeds with the fresh token

**Test Cases**:
1. **Unit**: `apps/api/src/channels/adapters/shopee.adapter.spec.ts` (continued)
   - testRefreshesExpiredToken(): Sets tokenExpiresAt to past, mocks refresh endpoint, asserts new token stored
   - testSkipsRefreshIfTokenValid(): Sets tokenExpiresAt to future, asserts refresh endpoint NOT called
   - testFetchOrdersPaginates(): Mocks two pages of orders (pageSize=50), asserts all orders returned
   - testFetchOrdersBacksOffOn429(): Mocks 429 on first call then success, asserts retry with delay
   - testFetchOrdersThrowsRateLimitErrorAfterMaxRetries(): All calls return 429, asserts RateLimitError thrown
   - **Coverage Target**: 90%

**Implementation**:
1. Implement `refreshTokenIfNeeded(connection)`: check `tokenExpiresAt < now + 5min buffer`, call Shopee refresh API, update DB
2. Implement `fetchOrders(since, connection)`: GET `api/v2/order/get_order_list` with `time_from`, `time_to`, pagination cursor
3. Handle HTTP 429 and Shopee error code `-1` (rate limit): throw `RateLimitError` for SyncExecutor to retry
4. Implement pagination loop: fetch until `more=false` or `next_cursor` empty
5. Run unit tests

---

### T-008: OAuthController and OAuthService - Shopee OAuth Callback

**User Story**: US-001
**Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-05
**Status**: [x] completed

**Test Plan**:
- **Given** an admin is authenticated and clicks "Connect Shopee"
- **When** GET /channels/oauth/shopee is called
- **Then** the response is a 302 redirect to Shopee's OAuth URL with a state parameter bound to the admin's session

**Test Cases**:
1. **Integration**: `apps/api/src/channels/oauth/oauth.controller.spec.ts`
   - testRedirectToShopeeOAuth(): GET /channels/oauth/shopee, asserts 302 with Location containing Shopee OAuth URL
   - testCallbackExchangesCodeAndRedirects(): GET /channels/oauth/callback?code=X&state=Y&shop_id=Z, mocks adapter.exchangeCode, asserts redirect to /admin/channels
   - testCallbackRejectsInvalidState(): Passes tampered state, asserts 400
   - testDisconnectDeletesCredentials(): DELETE /admin/channels/:id, asserts DB record deleted
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/src/channels/oauth/oauth.service.ts`
2. Implement `generateState(adminUserId)`: store `{userId, nonce}` in memory map with 10-min TTL, return signed state token
3. Implement `validateState(state)`: verify and pop from map; return userId or throw BadRequestException
4. Create `apps/api/src/channels/oauth/oauth.controller.ts` (no AdminGuard -- state validates instead)
5. Implement `GET /channels/oauth/:channel`: resolve adapter by channel param, call `getOAuthUrl(state)`, return redirect
6. Implement `GET /channels/oauth/callback`: validate state, call `adapter.exchangeCode(code, shopId)`, redirect to `/admin/channels`
7. Wire `OAuthModule` into `ChannelsModule`
8. Run integration tests

---

## User Story: US-003 - Automated Order Sync from Shopee

**Linked ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05
**Tasks**: 3 total, all completed

### T-009: OrderMapper - Shopee Order to ShopVui Order

**User Story**: US-003
**Satisfies ACs**: AC-US3-02, AC-US3-03
**Status**: [x] completed

**Test Plan**:
- **Given** a raw Shopee order object from the API response
- **When** mapShopeeOrder(rawOrder) is called
- **Then** the returned object has channel='shopee', channelOrderId=rawOrder.order_sn, and all customer/item/pricing fields populated

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/order-mapper.service.spec.ts`
   - testMapShopeeOrderBasicFields(): Maps a fixture order, asserts channelOrderId, channel, customerName, totalAmount
   - testMapShopeeOrderLineItems(): Asserts each item has productName, quantity, unitPrice
   - testMapShopeeOrderDeduplicationKey(): Two calls with same order_sn produce records with same channelOrderId
   - testMapShopeeOrderMissingOptionalFields(): Handles missing phone/address gracefully (null not crash)
   - **Coverage Target**: 95%

**Implementation**:
1. Create `apps/api/src/channels/sync/order-mapper.service.ts`
2. Implement `mapShopeeOrder(raw: ShopeeOrderRaw): CreateOrderDto`
3. Map fields: `order_sn` → `channelOrderId`, `buyer_username` → `customerName`, `item_list` → line items
4. Map `total_amount` (Shopee returns in smallest currency unit) to decimal amount
5. Set `channel='shopee'`, `paymentMethod='COD'` (fallback per plan), generate ShopVui order number
6. Handle `null`/`undefined` optional fields with safe defaults
7. Run unit tests

---

### T-010: SyncExecutor Order Upsert - Create New / Update Existing

**User Story**: US-003
**Satisfies ACs**: AC-US3-02, AC-US3-03, AC-US3-05
**Status**: [x] completed

**Test Plan**:
- **Given** a sync run that fetches 3 Shopee orders (2 new, 1 already in DB)
- **When** the executor processes them
- **Then** 2 orders are created, 1 is updated (matched by channel+channelOrderId), no duplicates exist

**Test Cases**:
1. **Integration**: `apps/api/src/channels/sync/sync-executor.integration.spec.ts`
   - testCreatesNewOrdersOnFirstSync(): Mocks adapter returning 3 orders, asserts 3 DB rows created
   - testUpdatesExistingOrdersOnResync(): Pre-creates 1 order, mocks adapter returning same ID with updated status, asserts 1 updated not duplicated
   - testNoDuplicatesOnRetry(): Runs executor twice for same orders, asserts same count (upsert behavior)
   - testSyncIntervalConfiguration(): Sets syncIntervalMinutes=5, asserts dispatcher isDue() reflects 5-min window
   - **Coverage Target**: 85%

**Implementation**:
1. In `SyncExecutorService.run()`, implement order upsert loop using Prisma `upsert` with `where: { channel_channelOrderId: { channel, channelOrderId } }`
2. Track `ordersCreated` and `ordersUpdated` counters for SyncLog
3. Update `lastSyncAt` to max `updated_at` from successfully processed orders
4. Expose `syncIntervalMinutes` from `ChannelConnection` and use in `SyncDispatcher.isDue()`
5. Verify Order model has `@@unique([channel, channelOrderId])` composite index (from increment 0004; add if missing)
6. Run integration tests

---

### T-011: AdminChannelsController - Manual Sync Trigger and Settings Update

**User Story**: US-003
**Satisfies ACs**: AC-US3-05, AC-US9-04
**Status**: [x] completed

**Test Plan**:
- **Given** an authenticated admin with a connected Shopee shop
- **When** POST /admin/channels/:id/sync is called
- **Then** a manual sync starts immediately (bypassing cron schedule) and the response includes a syncLogId

**Test Cases**:
1. **Integration**: `apps/api/src/admin/channels/admin-channels.controller.spec.ts`
   - testManualSyncTriggerReturns202(): POST /admin/channels/:id/sync, asserts 202 with { syncLogId }
   - testManualSyncRespectsGuard(): Calls sync while already running, returns 409
   - testUpdateSyncInterval(): PATCH /admin/channels/:id with syncIntervalMinutes=15, asserts DB updated
   - testUpdateSyncEnabled(): PATCH /admin/channels/:id with syncEnabled=false, asserts dispatcher skips it on next tick
   - **Coverage Target**: 85%

**Implementation**:
1. Create `apps/api/src/admin/channels/admin-channels.module.ts`, `controller.ts`, `service.ts`
2. `AdminChannelsService` delegates to `ChannelConnectionService` and `SyncDispatcher`
3. Implement `POST /admin/channels/:id/sync`: calls `SyncDispatcher.triggerNow(id)`, returns `{ syncLogId }` with 202
4. Return 409 if connection is already in `running` Set
5. Implement `PATCH /admin/channels/:id`: validates `syncEnabled` and `syncIntervalMinutes` (5-15 range), updates DB
6. Register `AdminChannelsModule` in `AppModule`
7. Run integration tests

---

## User Story: US-005 - Order Status Mapping

**Linked ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05, AC-US5-06, AC-US5-07, AC-US5-08, AC-US5-09, AC-US5-10, AC-US5-11
**Tasks**: 2 total, all completed

### T-012: Shopee Status Mapping - All 5 Statuses + Unknown Fallback

**User Story**: US-005
**Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05, AC-US5-11
**Status**: [x] completed

**Test Plan**:
- **Given** a Shopee order with status UNPAID
- **When** mapShopeeStatus(status) is called
- **Then** the return value is `{ status: 'PENDING', paymentStatus: 'UNPAID' }`

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/order-mapper.service.spec.ts` (Shopee status section)
   - testMapShopeeUnpaid(): Input 'UNPAID' → { status: PENDING, paymentStatus: UNPAID }
   - testMapShopeeReadyToShip(): Input 'READY_TO_SHIP' → { status: CONFIRMED }
   - testMapShopeeShipped(): Input 'SHIPPED' → { status: SHIPPING }
   - testMapShopeeCompleted(): Input 'COMPLETED' → { status: DELIVERED }
   - testMapShopeeCancelled(): Input 'CANCELLED' → { status: CANCELLED }
   - testMapShopeeUnknownStatus(): Input 'UNKNOWN_XYZ' → { status: PENDING } and logs warning
   - **Coverage Target**: 100%

**Implementation**:
1. Add `mapShopeeStatus(raw: string): { status: OrderStatus; paymentStatus?: PaymentStatus }` to `OrderMapperService`
2. Implement as exhaustive switch with `default` returning `PENDING` and calling `this.logger.warn()`
3. Call `mapShopeeStatus()` from `mapShopeeOrder()` when building the order DTO
4. Run unit tests ensuring all 6 test cases pass

---

### T-013: TikTok Status Mapping - All 5 Statuses + IN_TRANSIT + Unknown Fallback

**User Story**: US-005
**Satisfies ACs**: AC-US5-06, AC-US5-07, AC-US5-08, AC-US5-09, AC-US5-10, AC-US5-11
**Status**: [x] completed

**Test Plan**:
- **Given** a TikTok order with status AWAITING_PAYMENT
- **When** mapTikTokStatus(status) is called
- **Then** the return value is `{ status: 'PENDING' }`

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/order-mapper.service.spec.ts` (TikTok status section)
   - testMapTikTokAwaitingPayment(): Input 'AWAITING_PAYMENT' → { status: PENDING }
   - testMapTikTokAwaitingShipment(): Input 'AWAITING_SHIPMENT' → { status: CONFIRMED }
   - testMapTikTokShipped(): Input 'SHIPPED' → { status: SHIPPING }
   - testMapTikTokInTransit(): Input 'IN_TRANSIT' → { status: SHIPPING }
   - testMapTikTokDelivered(): Input 'DELIVERED' → { status: DELIVERED }
   - testMapTikTokCancelled(): Input 'CANCELLED' → { status: CANCELLED }
   - testMapTikTokUnknownStatus(): Input 'UNKNOWN_XYZ' → { status: PENDING } and logs warning
   - **Coverage Target**: 100%

**Implementation**:
1. Add `mapTikTokStatus(raw: string)` to `OrderMapperService` with exhaustive switch
2. Handle both 'SHIPPED' and 'IN_TRANSIT' mapping to SHIPPING
3. Default unknown → PENDING + logger.warn
4. Add `mapTikTokOrder(raw: TikTokOrderRaw): CreateOrderDto` method setting `channel='tiktok'`
5. Run unit tests

---

## User Story: US-002 - Connect TikTok Shop via OAuth

**Linked ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04
**Tasks**: 2 total, all completed

### T-014: TikTokAdapter - OAuth Flow (URL Generation and Code Exchange)

**User Story**: US-002
**Satisfies ACs**: AC-US2-01, AC-US2-02
**Status**: [x] completed

**Test Plan**:
- **Given** a TikTok app_key and redirect_uri configured in env
- **When** getOAuthUrl(state) is called
- **Then** the returned URL points to TikTok's OAuth endpoint with app_key and state params

**Test Cases**:
1. **Unit**: `apps/api/src/channels/adapters/tiktok.adapter.spec.ts`
   - testOAuthUrlContainsRequiredParams(): Asserts URL has app_key, redirect_uri, state
   - testExchangeCodeStoresEncryptedTokens(): Mocks TikTok token endpoint, asserts ChannelConnection created
   - testHmacSignatureFormat(): Asserts request signature matches TikTok HMAC-SHA256 spec
   - testExchangeCodeExtractsShopId(): Asserts shopId extracted from token response `open_id` field
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/channels/adapters/tiktok.adapter.ts` implementing `ChannelAdapter`
2. Inject `ConfigService` for `TIKTOK_APP_KEY`, `TIKTOK_APP_SECRET`, `TIKTOK_REDIRECT_URI`
3. Implement `getOAuthUrl(state)`: build `https://auth.tiktok-shops.com/oauth/authorize?...`
4. Implement private `sign(params, secret)`: HMAC-SHA256 of sorted param string (TikTok signing spec)
5. Implement `exchangeCode(code)`: POST to TikTok token endpoint, store encrypted tokens via ChannelConnectionService
6. Register `TikTokAdapter` in adapter registry map in `ChannelsModule`
7. Run unit tests

---

### T-015: TikTokAdapter - Token Refresh and fetchOrders with Rate-Limit Handling

**User Story**: US-002
**Satisfies ACs**: AC-US2-03, AC-US2-04, AC-US4-01, AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** a ChannelConnection with an expired TikTok access_token
- **When** refreshTokenIfNeeded() is called before fetchOrders
- **Then** the adapter calls TikTok's refresh endpoint and stores new encrypted tokens

**Test Cases**:
1. **Unit**: `apps/api/src/channels/adapters/tiktok.adapter.spec.ts` (continued)
   - testRefreshesExpiredToken(): Mocks refresh endpoint, asserts new token saved to DB
   - testSkipsRefreshIfTokenValid(): Asserts refresh NOT called when token is fresh
   - testFetchOrdersPaginates(): Mocks cursor-based pages, asserts all orders aggregated
   - testFetchOrdersBacksOffOnRateLimit(): Mocks rate-limit error code, asserts retry with delay
   - testFetchOrdersThrowsAfterMaxRetries(): All attempts rate-limited, asserts RateLimitError thrown
   - **Coverage Target**: 90%

**Implementation**:
1. Implement `refreshTokenIfNeeded(connection)`: check expiry with 5-min buffer, call TikTok refresh API, update ChannelConnection
2. Implement `fetchOrders(since, connection)`: GET TikTok `/api/orders/search` with `create_time_from`/`to`, cursor pagination
3. Handle TikTok error code `40029` (rate limit): throw `RateLimitError`
4. Implement cursor-based pagination loop (TikTok uses `next_page_token`)
5. Run unit tests

---

## User Story: US-004 - Automated Order Sync from TikTok Shop

**Linked ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04
**Tasks**: 2 total, all completed

### T-016: OrderMapper - TikTok Order to ShopVui Order

**User Story**: US-004
**Satisfies ACs**: AC-US4-02, AC-US4-03
**Status**: [x] completed

**Test Plan**:
- **Given** a raw TikTok order object from the API response
- **When** mapTikTokOrder(rawOrder) is called
- **Then** the returned object has channel='tiktok', channelOrderId=rawOrder.id, and all fields mapped

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/order-mapper.service.spec.ts` (TikTok section)
   - testMapTikTokOrderBasicFields(): Asserts channelOrderId=rawOrder.id, channel='tiktok', customerName
   - testMapTikTokOrderLineItems(): Asserts each item has productName, quantity, unitPrice from TikTok structure
   - testMapTikTokOrderPricing(): Asserts totalAmount from `payment_info.total_amount` field
   - testMapTikTokOrderMissingOptionalFields(): Handles missing recipient_address gracefully
   - **Coverage Target**: 95%

**Implementation**:
1. Implement `mapTikTokOrder(raw: TikTokOrderRaw): CreateOrderDto` in `OrderMapperService`
2. Map `id` → `channelOrderId`, `buyer_info.buyer_username` → `customerName`
3. Map `item_list` → line items with `sku_name`, `quantity`, `sale_price`
4. Map `payment_info.total_amount` → `totalAmount`
5. Set `channel='tiktok'`, `paymentMethod='COD'`, generate ShopVui order number
6. Call `mapTikTokStatus()` for status mapping
7. Run unit tests

---

### T-017: SyncExecutor Integration - TikTok End-to-End Sync

**User Story**: US-004
**Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04
**Status**: [x] completed

**Test Plan**:
- **Given** a connected TikTok ChannelConnection with syncEnabled=true
- **When** SyncExecutor.run() is called with a mocked TikTokAdapter
- **Then** orders are upserted with no duplicates and SyncLog is written with SUCCESS status

**Test Cases**:
1. **Integration**: `apps/api/src/channels/sync/tiktok-sync.integration.spec.ts`
   - testTikTokFullSyncCreatesOrders(): Mocks adapter, asserts 3 orders created with channel='tiktok'
   - testTikTokResyncUpdatesOrders(): Pre-creates 1 order, syncs again, asserts 1 updated not duplicated
   - testTikTokSyncLogsSuccess(): Asserts SyncLog entry with status=SUCCESS, ordersFetched, ordersCreated
   - testTikTokRateLimitRetriesAndLogs(): Mocks rate-limit then success, asserts final SyncLog is SUCCESS
   - **Coverage Target**: 85%

**Implementation**:
1. Reuse `SyncExecutorService` -- it delegates to the adapter resolved by `ChannelType`
2. Add `TikTokAdapter` to the adapter registry `Map<ChannelType, ChannelAdapter>` in `ChannelsModule`
3. Wire `OAuthController` to handle `channel=tiktok` param (already handles any registered channel)
4. Write integration test fixtures with sample TikTok API response shapes
5. Run integration tests

---

## User Story: US-007 - Admin Channel Management UI

**Linked ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04, AC-US7-05
**Tasks**: 3 total, all completed

### T-018: Admin API - GET /admin/channels and GET /admin/channels/:id/logs

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02
**Status**: [x] completed

**Test Plan**:
- **Given** two ChannelConnection records in the DB (one Shopee, one TikTok)
- **When** GET /admin/channels is called by an authenticated admin
- **Then** the response includes both connections as ChannelConnectionDto with no token fields

**Test Cases**:
1. **Integration**: `apps/api/src/admin/channels/admin-channels.controller.spec.ts` (GET section)
   - testListChannelsReturnsDto(): Asserts response shape matches ChannelConnectionDto, no token fields present
   - testListChannelsRequiresAdminAuth(): Unauthenticated request returns 401
   - testGetLogsReturnsPaginated(): Seeds 25 SyncLog entries, GET with page=2&limit=10, asserts 10 entries returned with pagination metadata
   - testGetLogsFilteredByConnection(): Asserts logs for connectionId A not mixed with connectionId B
   - **Coverage Target**: 85%

**Implementation**:
1. Implement `GET /admin/channels` in `AdminChannelsController` (guarded by `AdminGuard`)
2. Implement `GET /admin/channels/:id/logs` with `?page` and `?limit` query params
3. `AdminChannelsService.getLogs(id, page, limit)`: paginate `syncLogs` with `skip`/`take` Prisma
4. Response: `{ data: SyncLogDto[], total, page, limit }` wrapped in existing `ApiResponse` pattern
5. `SyncLogDto` includes: id, status, ordersFetched, ordersCreated, ordersUpdated, errorType, errorMessage, durationMs, startedAt, completedAt
6. Run integration tests

---

### T-019: Channel Settings Page - /admin/channels List View

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02, AC-US7-03, AC-US7-04, AC-US7-05
**Status**: [x] completed

**Test Plan**:
- **Given** the admin navigates to /admin/channels
- **When** the page loads with two connected channels
- **Then** each channel card shows name, connection status, last sync time, and action buttons (Sync Now, toggle, interval selector)

**Test Cases**:
1. **Unit**: `apps/admin/src/app/admin/channels/__tests__/page.test.tsx`
   - testRendersChannelCards(): Mocks API returning 2 connections, asserts 2 cards rendered with shopName
   - testShowsDisconnectedStateForUnconnected(): No connection for TikTok, asserts "Connect TikTok Shop" button shown
   - testSyncNowButtonTriggersApi(): Clicks Sync Now, asserts POST /admin/channels/:id/sync called
   - testToggleSyncEnabled(): Toggles switch, asserts PATCH /admin/channels/:id with syncEnabled=false
   - testIntervalDropdownSavesOnChange(): Changes dropdown to 15, asserts PATCH with syncIntervalMinutes=15
   - **Coverage Target**: 80%

**Implementation**:
1. Create `apps/admin/src/app/admin/channels/page.tsx` (Next.js App Router, server component for initial data)
2. Create `ChannelCard` client component with: shop name, status badge, lastSyncAt relative time, Sync Now button, enabled toggle, interval dropdown (5/10/15 min)
3. Implement `useChannelSync()` hook: calls `POST /admin/channels/:id/sync`, shows loading spinner while running
4. Implement `useChannelSettings()` hook: calls `PATCH /admin/channels/:id` on toggle/dropdown change
5. Add `/admin/channels` to the admin nav sidebar (consistent with existing nav pattern)
6. Run unit tests

---

### T-020: Sync Logs View and Connect OAuth Flow

**User Story**: US-007
**Satisfies ACs**: AC-US7-01, AC-US7-02
**Status**: [x] completed

**Test Plan**:
- **Given** a connected Shopee channel on the Channel Settings page
- **When** the admin clicks "View Logs"
- **Then** a paginated log table opens showing sync history with status badges and error details

**Test Cases**:
1. **Unit**: `apps/admin/src/app/admin/channels/__tests__/sync-logs.test.tsx`
   - testRendersLogTable(): Mocks 5 log entries, asserts table rows with timestamp, status, order counts
   - testPaginationLoadsNextPage(): Clicks "Next Page", asserts API called with page=2
   - testErrorLogShowsErrorType(): Log with errorType='rate_limit', asserts error badge rendered
   - testConnectButtonRedirectsToOAuth(): Clicks "Connect Shopee", asserts navigation to /channels/oauth/shopee
   - **Coverage Target**: 80%

**Implementation**:
1. Create `SyncLogsDrawer` client component (or route `/admin/channels/:id/logs`)
2. Implement paginated table: columns = Timestamp, Status, Fetched, Created, Updated, Duration, Error
3. Status badge: green (SUCCESS), red (FAILED), yellow (RUNNING)
4. Error rows: show `errorType` chip + `errorMessage` tooltip on hover
5. "Connect" button links to `GET /channels/oauth/:channel` which triggers OAuth redirect
6. Run unit tests

---

## User Story: US-008 - Sync Logs and Monitoring

**Linked ACs**: AC-US8-01, AC-US8-02, AC-US8-03
**Tasks**: 2 total, all completed

### T-021: SyncLog Detail - Structured Error Types and Human-Readable Messages

**User Story**: US-008
**Satisfies ACs**: AC-US8-01, AC-US8-02
**Status**: [x] completed

**Test Plan**:
- **Given** a sync failure due to a rate-limit error
- **When** the SyncLog is written
- **Then** the log entry has errorType='rate_limit' and a human-readable errorMessage describing the failure

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/sync-executor.service.spec.ts` (error logging section)
   - testRateLimitErrorType(): Mocks RateLimitError, asserts SyncLog.errorType='rate_limit'
   - testAuthExpiredErrorType(): Mocks token refresh failure, asserts errorType='auth_expired'
   - testNetworkErrorType(): Mocks network timeout, asserts errorType='network_error'
   - testMappingErrorType(): Mocks OrderMapper throwing, asserts errorType='mapping_error'
   - testErrorMessageIsHumanReadable(): Asserts errorMessage is a non-empty string, not a raw stack trace
   - **Coverage Target**: 90%

**Implementation**:
1. Define error type constants: `RATE_LIMIT`, `AUTH_EXPIRED`, `NETWORK_ERROR`, `MAPPING_ERROR`
2. Create `SyncError` base class with `errorType: string` and `humanMessage: string` fields
3. Create `RateLimitError`, `AuthExpiredError`, `NetworkError`, `MappingError` subclasses
4. In `SyncExecutorService`, catch these typed errors and write `SyncLog` with `errorType` and `errorMessage = error.humanMessage`
5. For unknown errors: use `NETWORK_ERROR` as fallback; log full stack trace server-side but store only `.message` in DB
6. Run unit tests

---

### T-022: SyncLog Cleanup Job - 30-Day Retention

**User Story**: US-008
**Satisfies ACs**: AC-US8-03
**Status**: [x] completed

**Test Plan**:
- **Given** SyncLog entries older than 30 days exist in the database
- **When** the cleanup cron job runs (daily at midnight)
- **Then** log entries older than 30 days are deleted and entries within 30 days are preserved

**Test Cases**:
1. **Unit**: `apps/api/src/channels/sync/sync-log-cleanup.service.spec.ts`
   - testDeletesLogsOlderThan30Days(): Seeds logs at 31 days ago, runs cleanup, asserts deleted from DB
   - testPreservesRecentLogs(): Seeds logs at 29 days ago, runs cleanup, asserts preserved in DB
   - testRunsDailyViaCron(): Asserts `@Cron` decorator is set for midnight daily execution
   - testHandlesEmptyLogTable(): Runs on empty table without error
   - **Coverage Target**: 90%

**Implementation**:
1. Create `apps/api/src/channels/sync/sync-log-cleanup.service.ts`
2. Implement `@Cron('0 0 * * *') cleanupOldLogs()`: `prisma.syncLog.deleteMany({ where: { startedAt: { lt: thirtyDaysAgo } } })`
3. Calculate `thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)`
4. Log count of deleted records at INFO level
5. Register in `ChannelsModule`
6. Run unit tests

---

## E2E Test Scenarios (Playwright)

**File**: `apps/admin/e2e/channels.spec.ts`

### E2E-001: Admin Connects a Shopee Channel
- **Given** admin is logged in and at /admin/channels
- **When** clicks "Connect Shopee" (mocked OAuth redirect via test server)
- **Then** new channel card appears with shopName and "Connected" status badge

### E2E-002: Admin Views Channel List with Sync Status
- **Given** two connected channels (seeded in test DB)
- **When** admin navigates to /admin/channels
- **Then** both channel cards are visible with correct lastSyncAt and status

### E2E-003: Admin Triggers Manual Sync
- **Given** a connected channel
- **When** admin clicks "Sync Now"
- **Then** loading spinner appears, then disappears with updated lastSyncAt timestamp

### E2E-004: Admin Views Sync Logs
- **Given** a connected channel with 5 sync log entries (seeded)
- **When** admin clicks "View Logs"
- **Then** log table shows 5 rows with status, timestamps, and order counts

### E2E-005: Admin Disconnects a Channel
- **Given** a connected channel
- **When** admin clicks "Disconnect" and confirms the dialog
- **Then** channel card shows "Disconnected" state and Connect button reappears
