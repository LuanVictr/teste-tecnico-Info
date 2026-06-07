import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;

  const config = new DocumentBuilder()
    .setTitle('Aivacol Fleet Management API')
    .setDescription(
      `Backend for fleet management — vehicles, models, brands and users\n\n` +
        `**Application running on port ${port}**\n\n` +
        `Swagger UI: http://localhost:${port}/api/docs`,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const logger = new Logger('Bootstrap');
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Swagger UI: http://localhost:${port}/api/docs`);
}
void bootstrap();
