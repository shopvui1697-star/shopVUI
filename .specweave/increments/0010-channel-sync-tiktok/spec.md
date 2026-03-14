---
increment: 0010-channel-sync-tiktok
title: Channel Sync - TikTok Backend
status: active
parent: 0008-channel-api-sync
agent: backend-tiktok
---

# Channel Sync - TikTok Backend

## Scope

TikTok-specific backend tasks from the master 0008-channel-api-sync increment:
- T-012: Verify Shopee status mapping tests (already implemented by backend-core)
- T-013: TikTok status mapping (already implemented in OrderMapperService by backend-core)
- T-014: TikTokAdapter OAuth flow
- T-015: TikTokAdapter token refresh and fetchOrders
- T-016: OrderMapper TikTok order mapping (mapTikTokOrder method)
- T-017: SyncExecutor TikTok integration
- T-018: Admin API GET endpoints (already implemented by backend-core)
- T-021: SyncLog structured error types (already implemented by backend-core)
- T-022: SyncLog cleanup job

## Upstream Dependencies

All foundation services (Prisma schema, ChannelAdapter interface, SyncExecutorService, OrderMapperService, errors.ts, ChannelsModule, OAuthController, AdminChannelsController/Service) are implemented by backend-core.

## Acceptance Criteria (from master spec)

- AC-US2-01 through AC-US2-04: TikTok OAuth connect/disconnect
- AC-US4-01 through AC-US4-04: TikTok order sync
- AC-US5-06 through AC-US5-11: TikTok status mapping
- AC-US8-03: SyncLog 30-day cleanup
