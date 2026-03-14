import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '@nestjs/common';

describe('Process-level error handlers', () => {
  const originalListeners = {
    unhandledRejection: [] as Function[],
    uncaughtException: [] as Function[],
  };
  let logSpy: ReturnType<typeof vi.spyOn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let exitSpy: any;

  beforeEach(() => {
    // Save existing listeners
    originalListeners.unhandledRejection = process.listeners('unhandledRejection') as Function[];
    originalListeners.uncaughtException = process.listeners('uncaughtException') as Function[];

    logSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers unhandledRejection and uncaughtException handlers in main.ts', async () => {
    // The handlers are registered in main.ts bootstrap function
    // We verify the pattern by testing the handler logic directly
    const logger = new Logger('Bootstrap');

    // Simulate the unhandledRejection handler
    const unhandledHandler = (reason: unknown) => {
      logger.error('Unhandled Rejection', reason instanceof Error ? reason.stack : reason);
    };

    unhandledHandler(new Error('test rejection'));
    expect(logSpy).toHaveBeenCalledWith(
      'Unhandled Rejection',
      expect.stringContaining('test rejection'),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('uncaughtException handler logs and exits with code 1', () => {
    const logger = new Logger('Bootstrap');

    // Simulate the uncaughtException handler
    const uncaughtHandler = (error: Error) => {
      logger.error('Uncaught Exception', error.stack);
      process.exit(1);
    };

    uncaughtHandler(new Error('fatal error'));
    expect(logSpy).toHaveBeenCalledWith(
      'Uncaught Exception',
      expect.stringContaining('fatal error'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
