import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '@nestjs/common';
import { RequestLoggerMiddleware } from '../request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  it('logs method, url, status code, and response time', () => {
    const req = { method: 'GET', originalUrl: '/api/products', url: '/api/products' } as any;
    const finishHandlers: Function[] = [];
    const res = {
      statusCode: 200,
      on: (event: string, handler: Function) => {
        if (event === 'finish') finishHandlers.push(handler);
      },
    } as any;
    const next = vi.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();

    // Simulate response finish
    finishHandlers.forEach((h) => h());

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/GET \/api\/products 200 \d+ms/),
    );
  });

  it('skips logging for /api/health', () => {
    const req = { method: 'GET', originalUrl: '/api/health', url: '/api/health' } as any;
    const res = {
      statusCode: 200,
      on: vi.fn(),
    } as any;
    const next = vi.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.on).not.toHaveBeenCalled();
  });

  it('includes response time in milliseconds', () => {
    const req = { method: 'POST', originalUrl: '/api/orders', url: '/api/orders' } as any;
    const finishHandlers: Function[] = [];
    const res = {
      statusCode: 201,
      on: (event: string, handler: Function) => {
        if (event === 'finish') finishHandlers.push(handler);
      },
    } as any;
    const next = vi.fn();

    middleware.use(req, res, next);
    finishHandlers.forEach((h) => h());

    const logCall = logSpy.mock.calls[0][0] as string;
    expect(logCall).toMatch(/\d+ms$/);
  });
});
