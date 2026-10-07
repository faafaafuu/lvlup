import { ParsedEntity } from '@levelup/domain';

/** Извлекатель сущностей из фразы. Калории не считает — только «что и сколько». */
export interface FoodExtractor {
  readonly name: string;
  extract(text: string, signal: AbortSignal): Promise<ParsedEntity[]>;
}
