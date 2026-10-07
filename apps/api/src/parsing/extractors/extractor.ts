import { Extraction } from './schema';

/** Извлекатель сущностей из фразы. Калории не считает — только «что, сколько и как долго». */
export interface FoodExtractor {
  readonly name: string;
  extract(text: string, signal: AbortSignal): Promise<Extraction>;
}
