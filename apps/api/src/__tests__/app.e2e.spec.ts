import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { HealthModule } from '../health/health.module';

vi.mock('@shopvui/db', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

describe('App E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              GOOGLE_CLIENT_ID: 'test-client-id',
              GOOGLE_CLIENT_SECRET: 'test-client-secret',
              GOOGLE_CALLBACK_URL: 'http://localhost:4000/api/auth/google/callback',
              JWT_SECRET: 'test-jwt-secret',
              JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
            }),
          ],
        }),
        HealthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns 200', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });
});
