const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { z } = require('zod');

const router = express.Router();

router.use(authenticate);

// Validation schemas
const categoryBaseSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(4),
});

const createCategorySchema = categoryBaseSchema;
const updateCategorySchema = categoryBaseSchema.partial();

// GET /calendar-categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.calendarCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error('GET /calendar-categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /calendar-categories
router.post('/', async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const category = await prisma.calendarCategory.create({ data: parsed.data });
    res.status(201).json(category);
  } catch (err) {
    console.error('POST /calendar-categories error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to create category' });
  }
});

// PATCH /calendar-categories/:id
router.patch('/:id', async (req, res) => {
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const existing = await prisma.calendarCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const category = await prisma.calendarCategory.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(category);
  } catch (err) {
    console.error('PATCH /calendar-categories error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to update category' });
  }
});

// DELETE /calendar-categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.calendarCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const count = await prisma.calendarEvent.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      return res.status(400).json({ error: 'Categoria em uso', count });
    }

    await prisma.calendarCategory.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /calendar-categories error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to delete category' });
  }
});

module.exports = router;
