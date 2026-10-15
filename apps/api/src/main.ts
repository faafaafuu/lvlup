import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { cors: true });
  // Каждое обращение — строкой в журнал: видно, доходит ли телефон и какая версия у него стоит.
  app.use((req: { method: string; originalUrl: string; socket?: { remoteAddress?: string } }, res: { statusCode: number; on(e: 'finish', f: () => void): void }, next: () => void) => {
    const started = Date.now();
    res.on('finish', () => console.log(`запрос ${req.method} ${req.originalUrl.slice(0, 120)} → ${res.statusCode} за ${Date.now() - started}мс от ${req.socket?.remoteAddress ?? '?'}`));
    next();
  });
  await app.listen(config.port, '0.0.0.0');
  console.log(`Level Up API :${config.port}, извлекатель: ${config.extractor}, токен: ${config.apiToken ? 'да' : 'НЕТ'}`);
}

void bootstrap();
