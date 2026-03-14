import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from '../health.controller';

const mockQueryRaw = vi.fn();

vi.mock('@shopvui/db', () => ({
  prisma: {
    $queryRaw: (...args: any[]) => mockQueryRaw(...args),
  },
}));

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
    vi.clearAllMocks();
  });

  it('returns 200 with ok status when database is reachable', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.getHealth();
    expect(result).toEqual({ status: 'ok', database: 'connected' });
  });

  it('throws 503 when database is unreachable', async () => {
    mockQueryRaw.mockRejectedValue(new Error('Connection refused'));

    await expect(controller.getHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('throws 503 when database times out after 2 seconds', async () => {
    mockQueryRaw.mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    const start = Date.now();
    await expect(controller.getHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1900);
    expect(elapsed).toBeLessThan(3000);
  }, 5000);
});
