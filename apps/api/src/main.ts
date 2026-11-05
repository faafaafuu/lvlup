import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config';
import { journal } from './journal';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { cors: true });
  // Каждое обращение — строкой в журнал: видно, доходит ли телефон и какая версия у него стоит.
  app.use((req: { method: string; originalUrl: string; socket?: { remoteAddress?: string } }, res: { statusCode: number; on(e: 'finish', f: () => void): void }, next: () => void) => {
    const started = Date.now();
    // Без IP-адресов — так обещает политика конфиденциальности.
    res.on('finish', () => journal(`запрос ${req.method} ${req.originalUrl.slice(0, 120)} → ${res.statusCode} за ${Date.now() - started}мс`));
    next();
  });
  await app.listen(config.port, '0.0.0.0');
  console.log(`Level Up API :${config.port}, извлекатель: ${config.extractor}, токен: ${config.apiToken ? 'да' : 'НЕТ'}`);
}

void bootstrap();
