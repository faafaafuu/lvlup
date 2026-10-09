import { BadRequestException, Body, Controller, HttpException, HttpStatus, Inject, Post } from '@nestjs/common';
import { UserPortions } from '@levelup/domain';
import { MealParser, ParseResult } from './meal-parser';

interface ParseBody {
  text?: unknown;
  portions?: UserPortions;
  bodyWeightKg?: number;
}

/** Предохранитель от слива денег за LLM, если токен утечёт: не больше N разборов в сутки. */
const DAILY_LIMIT = Number(process.env.DAILY_PARSE_LIMIT ?? 300);

@Controller('v1/meals')
export class ParseController {
  private day = '';
  private count = 0;

  constructor(@Inject(MealParser) private readonly parser: MealParser) {}

  @Post('parse')
  parse(@Body() body: ParseBody): Promise<ParseResult> {
    if (typeof body?.text !== 'string' || !body.text.trim()) {
      throw new BadRequestException('Нужен непустой text');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.count = 0;
    }
    if (++this.count > DAILY_LIMIT) throw new HttpException('Дневной лимит разборов исчерпан', HttpStatus.TOO_MANY_REQUESTS);
    const kg = typeof body.bodyWeightKg === 'number' && body.bodyWeightKg > 20 ? body.bodyWeightKg : undefined;
    return this.parser.parse(body.text, body.portions, kg);
  }
}
