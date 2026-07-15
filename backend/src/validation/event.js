const { z } = require('zod');

const RecurrenceTypeEnum = z.enum(['NONE', 'YEARLY', 'WEEKLY']);

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  personId: z.string().cuid().nullable().optional(),
  startAt: z.string().datetime(),
  allDay: z.boolean().optional().default(true),
  recurrence: RecurrenceTypeEnum.optional().default('NONE'),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional().default([]),
  description: z.string().max(1000).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.recurrence === 'WEEKLY' && (!data.recurrenceDays || data.recurrenceDays.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'recurrenceDays is required for WEEKLY recurrence', path: ['recurrenceDays'] });
  }
  if (data.recurrence !== 'WEEKLY' && data.recurrenceDays && data.recurrenceDays.length > 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'recurrenceDays only applies to WEEKLY recurrence', path: ['recurrenceDays'] });
  }
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  categoryId: z.string().min(1).optional(),
  personId: z.string().cuid().nullable().optional(),
  startAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  recurrence: RecurrenceTypeEnum.optional(),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional(),
  description: z.string().max(1000).nullable().optional(),
});

const listEventsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

module.exports = { createEventSchema, updateEventSchema, listEventsSchema };
