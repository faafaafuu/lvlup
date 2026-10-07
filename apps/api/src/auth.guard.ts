import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { AppConfig } from './config';
import { APP_CONFIG } from './tokens';

/** Сервер смотрит в интернет и тратит деньги на LLM — без токена пускаем только /health. */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.apiToken;
    const req = context.switchToHttp().getRequest<{ path: string; headers: Record<string, string | undefined> }>();
    if (!expected || req.path === '/health') return true;
    const given = req.headers['x-api-key'] ?? '';
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Неверный x-api-key');
    return true;
  }
}
