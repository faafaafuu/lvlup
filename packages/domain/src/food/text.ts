/** Нормализация и грубый стеммер русского: для поиска блюд хватает отрезания окончаний. */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d)\s*(г|гр|мл|кг|л)\b/g, '$1 $2')
    .replace(/[^a-zа-я0-9.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}

const ENDINGS = [
  'иями', 'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ой', 'ей', 'ую', 'юю',
  'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ых', 'их', 'ым', 'им', 'ом', 'ем', 'ам', 'ям', 'ах', 'ях',
  'ов', 'ев', 'а', 'я', 'у', 'ю', 'ы', 'и', 'е', 'о', 'ь', 'й',
];

export function stem(word: string): string {
  if (/^\d/.test(word) || word.length <= 2) return word;
  for (const ending of ENDINGS) {
    // Короткие слова («чай»/«чая») режем только по одной букве, иначе съедим корень.
    const minStem = ending.length === 1 ? 2 : 3;
    if (word.endsWith(ending) && word.length - ending.length >= minStem) {
      return word.slice(0, -ending.length);
    }
  }
  return word;
}

const NUMBER_WORDS: Record<string, number> = {
  ноль: 0, один: 1, одна: 1, одну: 1, одно: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5,
  шесть: 6, семь: 7, восемь: 8, девять: 9, десять: 10, пятнадцать: 15, двадцать: 20,
  тридцать: 30, сорок: 40, пятьдесят: 50, сто: 100, двести: 200, триста: 300,
  четыреста: 400, пятьсот: 500, шестьсот: 600, семьсот: 700, восемьсот: 800, тысяча: 1000,
  пара: 2, пару: 2, полтора: 1.5, полторы: 1.5, половина: 0.5, половину: 0.5, пол: 0.5,
  четверть: 0.25, треть: 0.33, несколько: 3,
};

/** Число из токена: «2», «1.5», «два», «полтора». Составные «двести пятьдесят» склеивает readNumber. */
export function wordToNumber(token: string): number | null {
  if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
  return NUMBER_WORDS[token] ?? null;
}

/** «пол-тарелки», «полтарелки» → ['пол', 'тарелки']. */
export function splitHalfPrefix(tokens: string[]): string[] {
  const out: string[] = [];
  for (const token of tokens) {
    const match = /^пол-?(.{4,})$/.exec(token);
    if (match && !token.startsWith('полтор') && !token.startsWith('полов') && !token.startsWith('полезн')) {
      out.push('пол', match[1]!);
    } else {
      out.push(token);
    }
  }
  return out;
}
