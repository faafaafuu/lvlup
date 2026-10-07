import { BadRequestException, Body, Controller, Inject, Post } from '@nestjs/common';
import { UserPortions } from '@levelup/domain';
import { MealParser, ParseResult } from './meal-parser';

interface ParseBody {
  text?: unknown;
  portions?: UserPortions;
}

@Controller('v1/meals')
export class ParseController {
  constructor(@Inject(MealParser) private readonly parser: MealParser) {}

  @Post('parse')
  parse(@Body() body: ParseBody): Promise<ParseResult> {
    if (typeof body?.text !== 'string' || !body.text.trim()) {
      throw new BadRequestException('Нужен непустой text');
    }
    return this.parser.parse(body.text, body.portions);
  }
}
