'use strict';

const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { matchItemsToOffers } = require('../services/aiMatching');

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1).max(200),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  checked: z.boolean().optional(),
});

// GET /shopping-list
router.get('/', async (req, res) => {
  const items = await prisma.shoppingListItem.findMany({
    where: { userId: req.user.id },
    include: { matchedOffer: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(items);
});

// POST /shopping-list
router.post('/', async (req, res) => {
  const result = createSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ error: result.error.errors[0].message });
  }

  const item = await prisma.shoppingListItem.create({
    data: { userId: req.user.id, name: result.data.name },
    include: { matchedOffer: true },
  });

  // Trigger AI matching in background (non-blocking)
  prisma.shoppingListItem
    .findMany({ where: { userId: req.user.id, checked: false } })
    .then(items => matchItemsToOffers(items))
    .catch(err => console.error('AI matching error:', err));

  res.status(201).json(item);
});

// PATCH /shopping-list/:id
router.patch('/:id', async (req, res) => {
  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ error: result.error.errors[0].message });
  }

  const existing = await prisma.shoppingListItem.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: 'Not found' });
  }

  const item = await prisma.shoppingListItem.update({
    where: { id: req.params.id },
    data: result.data,
    include: { matchedOffer: true },
  });
  res.json(item);
});

// DELETE /shopping-list/:id
router.delete('/:id', async (req, res) => {
  const existing = await prisma.shoppingListItem.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: 'Not found' });
  }
  await prisma.shoppingListItem.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;
