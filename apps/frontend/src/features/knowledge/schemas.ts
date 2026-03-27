import { z } from "zod";

export const createCorpusSchema = z.object({
  name: z.string().min(1, "Corpus name is required").max(255),
  description: z.string().max(1000).optional(),
});

export type CreateCorpusInput = z.infer<typeof createCorpusSchema>;
