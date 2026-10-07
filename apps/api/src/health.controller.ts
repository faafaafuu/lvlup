import { Controller, Get, Inject } from '@nestjs/common';
import { CATALOG } from '@levelup/domain';
import { APP_CONFIG } from './tokens';
import { AppConfig } from './config';

@Controller('health')
export class HealthController {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  @Get()
  health() {
    return { ok: true, extractor: this.config.extractor, catalogSize: CATALOG.length };
  }
}
