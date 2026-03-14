import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../http-exception.filter';

function createMockHost(url = '/api/test') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const request = { url };
  const response = { status };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as any;

  return { host, json, status, request, response };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  // T-001: Standardized error shape for HttpException
  it('returns standardized shape for HttpException', () => {
    const { host, status, json } = createMockHost('/api/products/999');
    const exception = new NotFoundException('Product not found');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: 404,
      message: 'Product not found',
      path: '/api/products/999',
    });
    expect(body.timestamp).toBeDefined();
    expect(body.error).toBeDefined();
  });

  // T-001: Preserve array messages from ValidationPipe
  it('preserves array messages from ValidationPipe BadRequestException', () => {
    const { host, status, json } = createMockHost();
    const exception = new BadRequestException({
      message: ['email must be an email', 'name should not be empty'],
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(body.message).toEqual([
      'email must be an email',
      'name should not be empty',
    ]);
    expect(body.error).toBe('Bad Request');
  });

  // T-001: Non-HTTP exception returns 500
  it('returns 500 for non-HTTP exceptions with no stack trace', () => {
    const { host, status, json } = createMockHost('/api/orders');
    const exception = new Error('Database connection failed');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
      path: '/api/orders',
    });
    expect(body.timestamp).toBeDefined();
  });

  // T-002: Response body never leaks stack traces
  it('does not leak stack trace in response body', () => {
    const { host, json } = createMockHost();
    const exception = new Error('boom');
    exception.stack = 'Error: boom\n    at /app/src/service.ts:42:13';

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    const bodyKeys = Object.keys(body).sort();
    expect(bodyKeys).toEqual(['error', 'message', 'path', 'statusCode', 'timestamp']);
    expect(JSON.stringify(body)).not.toContain('stack');
    expect(JSON.stringify(body)).not.toContain('service.ts');
  });

  // T-002: Prisma-style errors don't leak internal details
  it('does not leak Prisma error details in response body', () => {
    const { host, json } = createMockHost();
    const exception = new Error(
      'PrismaClientKnownRequestError: Invalid `prisma.user.findUnique()`',
    );
    (exception as any).code = 'P2002';
    (exception as any).meta = { target: ['email'] };

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('prisma');
    expect(JSON.stringify(body)).not.toContain('P2002');
  });

  // T-002: Logs error server-side for observability
  it('logs the full error server-side', () => {
    const logSpy = vi.spyOn(Logger.prototype, 'error');
    const { host } = createMockHost();
    const exception = new Error('something broke');

    filter.catch(exception, host);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('something broke'),
      expect.any(String),
    );
  });

  // T-002: Non-Error thrown values handled safely
  it('handles non-Error thrown values', () => {
    const { host, status, json } = createMockHost();

    filter.catch('string error', host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.message).toBe('Internal server error');
  });
});
