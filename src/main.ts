import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { DatabaseGateway } from './database.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
    .setTitle('Enbase platform')
    .setDescription('Open source backend platform')
    .setVersion('1.0')
    .addTag('enbase')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(new ValidationPipe());
  app.resolve(DatabaseGateway);
  app.enableCors();
  await app.listen(3000);
}

bootstrap();
