import { z } from 'zod/v4';
import { UNIT_IDS } from './prompt';

export const ExtractionSchema = z.object({
  activities: z.array(
    z.object({
      text: z.string(),
      activityId: z.string().nullable(),
      minutes: z.number().nullable(),
      reps: z.number().nullable(),
      weightKg: z.number().nullable(),
    }),
  ),
  items: z.array(
    z.object({
      text: z.string(),
      foodId: z.string().nullable(),
      quantity: z.number().nullable(),
      unit: z.enum(UNIT_IDS).nullable(),
      grams: z.number().nullable(),
    }),
  ),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

/** JSON Schema для провайдеров без zod-хелперов (OpenAI, Ollama). */
export const EXTRACTION_JSON_SCHEMA = z.toJSONSchema(ExtractionSchema);
