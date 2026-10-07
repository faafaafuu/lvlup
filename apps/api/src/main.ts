import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(config.port, '0.0.0.0');
  console.log(`Level Up API :${config.port}, извлекатель: ${config.extractor}, токен: ${config.apiToken ? 'да' : 'НЕТ'}`);
}

void bootstrap();
