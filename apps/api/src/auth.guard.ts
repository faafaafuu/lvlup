import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { AppConfig } from './config';
import { APP_CONFIG } from './tokens';

/**
 * Свой токен (x-api-key) — без ограничений, кроме общего дневного лимита.
 * Без токена — приложение «из коробки»: токен в публичном IPA всё равно не секрет,
 * поэтому вместо него — лимит разборов в сутки на один адрес (PUBLIC_PER_IP_LIMIT,
 * 0 — только по токену). Общий предохранитель от трат — DAILY_PARSE_LIMIT.
 */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  private day = '';
  private perIp = new Map<string, number>();

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.apiToken;
    const req = context.switchToHttp().getRequest<{ path: string; headers: Record<string, string | undefined>; socket?: { remoteAddress?: string } }>();
    if (!expected || req.path === '/health') return true;
    const given = Buffer.from(req.headers['x-api-key'] ?? '');
    const own = Buffer.from(expected);
    if (given.length === own.length && timingSafeEqual(given, own)) return true;

    const limit = this.config.publicPerIpLimit;
    if (limit <= 0) throw new HttpException('Неверный x-api-key', HttpStatus.UNAUTHORIZED);
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.perIp.clear();
    }
    const ip = req.socket?.remoteAddress ?? '?';
    const used = (this.perIp.get(ip) ?? 0) + 1;
    this.perIp.set(ip, used);
    if (used > limit) throw new HttpException('Дневной лимит разборов для этого адреса исчерпан', HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}
