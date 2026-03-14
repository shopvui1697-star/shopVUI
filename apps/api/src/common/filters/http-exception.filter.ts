import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
          ? (exceptionResponse as Record<string, unknown>).message
          : exception.message;

      const error =
        typeof exceptionResponse === 'object' &&
        'error' in exceptionResponse
          ? (exceptionResponse as Record<string, unknown>).error
          : exception.message;

      response.status(status).json({
        statusCode: status,
        message,
        error,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(`Unhandled exception: ${error.message}`, error.stack);

      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
