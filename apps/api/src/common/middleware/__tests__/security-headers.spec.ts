import { describe, it, expect } from 'vitest';
import helmet from 'helmet';

describe('Security Headers (helmet)', () => {
  it('helmet is a valid middleware function', () => {
    const middleware = helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    });
    expect(typeof middleware).toBe('function');
  });

  it('helmet middleware sets security headers on response', async () => {
    const middleware = helmet();

    const req = {} as any;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key.toLowerCase()] = value;
      },
      removeHeader: () => {},
      getHeader: () => undefined,
    } as any;

    await new Promise<void>((resolve) => {
      middleware(req, res, () => {
        resolve();
      });
    });

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
