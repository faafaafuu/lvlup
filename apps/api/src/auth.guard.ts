import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { AppConfig } from './config';
import { Quota } from './quota';
import { APP_CONFIG } from './tokens';

/**
 * Свой токен (x-api-key) — без ограничений, кроме общего дневного лимита.
 * Без токена — приложение «из коробки»: токен в публичном IPA всё равно не секрет,
 * поэтому вместо него — лимит разборов в сутки на один адрес (PUBLIC_PER_IP_LIMIT,
 * 0 — только по токену). Общий предохранитель от трат — DAILY_PARSE_LIMIT.
 */
/** Без токена и лимитов: проверка жизни и страницы для App Store. */
const OPEN = new Set(['/health', '/', '/privacy', '/support']);

@Injectable()
export class ApiTokenGuard implements CanActivate {
  private day = '';
  private perIp = new Map<string, number>();
  private perDevice = new Map<string, number>();
  private readonly quota: Quota;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.quota = new Quota(process.env.JOURNAL_DIR || 'journal', config.freeAiPerMonth);
    process.once('beforeExit', () => this.quota.flush());
    process.once('SIGTERM', () => {
      this.quota.flush();
      process.exit(0);
    });
  }

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.apiToken;
    const res = context.switchToHttp().getResponse<{ setHeader(k: string, v: string): void }>();
    const req = context.switchToHttp().getRequest<{ path: string; headers: Record<string, string | undefined>; socket?: { remoteAddress?: string } }>();
    if (!expected || OPEN.has(req.path)) return true;
    const given = Buffer.from(req.headers['x-api-key'] ?? '');
    const own = Buffer.from(expected);
    if (given.length === own.length && timingSafeEqual(given, own)) return true;

    const limit = this.config.publicPerIpLimit;
    if (limit <= 0) throw new HttpException('Неверный x-api-key', HttpStatus.UNAUTHORIZED);
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.perIp.clear();
      this.perDevice.clear();
    }
    // Случайный id установки приложения: точный лимит на человека, не связан с личностью.
    const device = (req.headers['x-device'] ?? '').slice(0, 64);
    if (device) {
      const n = (this.perDevice.get(device) ?? 0) + 1;
      this.perDevice.set(device, n);
      if (n > this.config.perDeviceLimit) throw new HttpException('Дневной лимит разборов исчерпан — завтра снова', HttpStatus.TOO_MANY_REQUESTS);
      if (this.config.freeAiPerMonth > 0 && req.path === '/v1/meals/parse') {
        const left = this.quota.take(device);
        // 402: приложение узнаёт по коду, что это лимит, а не поломка, и разбирает на телефоне.
        if (left < 0) throw new HttpException({ code: 'free_quota', message: 'Бесплатные разборы с ИИ на этот месяц закончились' }, HttpStatus.PAYMENT_REQUIRED);
        res.setHeader('x-ai-left', String(left));
      }
    }
    // За nginx (hrum.noahlab.ru) все приходят с его адреса — настоящий берём из X-Real-IP,
    // но верим заголовку только от своих (локальных) адресов.
    const peer = req.socket?.remoteAddress ?? '?';
    const local = /^(::ffff:)?(127\.|172\.(1[6-9]|2\d|3[01])\.|10\.)|^::1$/.test(peer);
    const ip = (local && req.headers['x-real-ip']) || peer;
    const used = (this.perIp.get(ip) ?? 0) + 1;
    this.perIp.set(ip, used);
    if (used > limit) throw new HttpException('Дневной лимит разборов для этого адреса исчерпан', HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}
