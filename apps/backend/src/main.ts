import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);
  const appConfiguration = configService.getOrThrow<AppConfig>('app');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (appConfiguration.corsOrigin) {
    app.enableCors({
      origin: appConfiguration.corsOrigin,
      credentials: true,
    });
  }

  setupSwagger(app);

  const logger = new Logger('Bootstrap');
  await app.listen(appConfiguration.port);
  logger.log(`Application is running on port ${appConfiguration.port}`);
}

bootstrap();
