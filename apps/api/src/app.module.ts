import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiTokenGuard } from './auth.guard';
import { AppConfig, loadConfig } from './config';
import { HealthController } from './health.controller';
import { createExtractor } from './parsing/extractors';
import { MealParser } from './parsing/meal-parser';
import { ParseController } from './parsing/parse.controller';
import { APP_CONFIG } from './tokens';

@Module({
  controllers: [ParseController, HealthController],
  providers: [
    { provide: APP_CONFIG, useFactory: () => loadConfig() },
    {
      provide: MealParser,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => new MealParser(createExtractor(config.extractor, config), config.llmTimeoutMs),
    },
    { provide: APP_GUARD, useClass: ApiTokenGuard },
  ],
})
export class AppModule {}
