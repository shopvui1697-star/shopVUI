import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AdminOrderFiltersDto,
  UpdateOrderStatusDto,
  BulkOrderActionDto,
} from '../admin-order-filters.dto';

describe('AdminOrderFiltersDto', () => {
  it('passes with valid filters', async () => {
    const dto = plainToInstance(AdminOrderFiltersDto, {
      status: 'PENDING',
      page: 1,
      pageSize: 20,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails with invalid status enum', async () => {
    const dto = plainToInstance(AdminOrderFiltersDto, {
      status: 'INVALID_STATUS',
    });
    const errors = await validate(dto);
    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
  });

  it('fails with invalid page (not integer)', async () => {
    const dto = plainToInstance(AdminOrderFiltersDto, {
      page: -1,
    });
    const errors = await validate(dto);
    const pageError = errors.find((e) => e.property === 'page');
    expect(pageError).toBeDefined();
  });

  it('passes with all optional fields empty', async () => {
    const dto = plainToInstance(AdminOrderFiltersDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('UpdateOrderStatusDto', () => {
  it('passes with valid status', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, {
      status: 'CONFIRMED',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails with invalid status', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, {
      status: 'INVALID',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('BulkOrderActionDto', () => {
  it('passes with valid data', async () => {
    const dto = plainToInstance(BulkOrderActionDto, {
      orderIds: ['id1', 'id2'],
      action: 'mark_shipped',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails with non-array orderIds', async () => {
    const dto = plainToInstance(BulkOrderActionDto, {
      orderIds: 'not-array',
      action: 'mark_shipped',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
