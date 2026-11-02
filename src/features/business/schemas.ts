import { z } from 'zod';

import { mn } from '@/i18n/mn';
import { BUSINESS_TYPES, CURRENCIES } from '@/types/models';

const v = mn.validation;

export const businessSchema = z.object({
  name: z.string().trim().min(1, v.required).max(100, v.tooLong),
  businessType: z.enum(BUSINESS_TYPES, v.required),
  currency: z.enum(CURRENCIES),
});

export type BusinessInput = z.infer<typeof businessSchema>;
