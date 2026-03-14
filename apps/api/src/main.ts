import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'), {
    prefix: '/uploads/',
  });

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3001',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('ShopVui API')
    .setDescription('ShopVui E-commerce API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const logger = new Logger('Bootstrap');

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason instanceof Error ? reason.stack : reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error.stack);
    process.exit(1);
  });

  await app.listen(process.env.PORT || 4000);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
