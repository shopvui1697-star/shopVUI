---
increment: 0009-channel-sync-core
title: Channel Sync Core - Backend Services
status: active
parent: 0008-channel-api-sync
scope: T-001 to T-011
---

# Channel Sync Core - Backend Services

## Scope

This increment covers the backend foundation for channel API sync: Prisma schema, credential encryption, CRUD services, sync dispatcher/executor, Shopee adapter (OAuth + fetchOrders), OAuth controller, order mapper, order upsert logic, and admin channels API.

## User Stories Covered

- **US-006**: Channel Credentials Security (T-001, T-002)
- **US-009**: Background Job Infrastructure (T-003, T-004, T-005)
- **US-001**: Connect Shopee Shop via OAuth (T-006, T-007, T-008)
- **US-003**: Automated Order Sync from Shopee (T-009, T-010, T-011)

## Key Decisions

- Uses `prisma` singleton from `@shopvui/db` (existing pattern)
- AES-256-GCM encryption via Node.js `crypto` (no external deps)
- `@nestjs/schedule` already in deps — uses `@Cron(CronExpression.EVERY_MINUTE)` for dispatcher
- In-memory `Set<string>` for concurrency guard (single-process deployment)
- OAuth callback validated by state parameter, not AdminGuard
- Order upsert via Prisma `upsert` with `channel + externalOrderId` composite key (index already exists)
