const { z } = require('zod');

const WorkoutTypeEnum = z.enum(['MUSCULACAO', 'CORRIDA', 'NATACAO', 'YOGA', 'CAMINHADA', 'FUTEBOL', 'OUTRO']);
const WorkoutIntensityEnum = z.enum(['LEVE', 'MODERADO', 'INTENSO']);

const createWorkoutSchema = z.object({
  type: WorkoutTypeEnum,
  durationMinutes: z.number().int().positive().optional(),
  intensity: WorkoutIntensityEnum.optional(),
  note: z.string().max(500).nullable().optional(),
  date: z.string().datetime(),
});

module.exports = { createWorkoutSchema };
