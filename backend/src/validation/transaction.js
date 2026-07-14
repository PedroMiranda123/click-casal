const { z } = require('zod');

const transactionInputSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE']),
    originalAmount: z.number().int().positive(),
    originalCurrency: z.enum(['DKK', 'BRL']),
    paymentMethodId: z.string().min(1),
    categoryId: z.string().min(1).optional().nullable(),
    occurredAt: z.coerce.date(),
    description: z.string().max(280).optional().nullable(),
  })
  .refine((data) => data.occurredAt.getTime() <= Date.now(), {
    message: 'occurredAt cannot be in the future',
    path: ['occurredAt'],
  })
  .refine((data) => data.type !== 'EXPENSE' || !!data.categoryId, {
    message: 'categoryId is required for EXPENSE transactions',
    path: ['categoryId'],
  })
  .refine((data) => data.type !== 'INCOME' || !data.categoryId, {
    message: 'categoryId must be omitted for INCOME transactions',
    path: ['categoryId'],
  });

function formatZodError(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

module.exports = { transactionInputSchema, formatZodError };
