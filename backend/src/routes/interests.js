'use strict';

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticate = require('../middleware/authenticate');

// GET /api/interests — return current user's interest tags
router.get('/', authenticate, async (req, res) => {
  try {
    const interests = await prisma.userInterest.findMany({
      where: { userId: req.user.id },
      orderBy: { label: 'asc' },
    });
    res.json(interests);
  } catch (err) {
    console.error('[interests] GET error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/interests — add a tag (idempotent via upsert)
router.post('/', authenticate, async (req, res) => {
  const { label } = req.body;
  if (!label || !label.trim()) return res.status(400).json({ error: 'label é obrigatório' });
  if (label.trim().length > 100) return res.status(400).json({ error: 'label muito longo (máx 100)' });

  try {
    const interest = await prisma.userInterest.upsert({
      where: { userId_label: { userId: req.user.id, label: label.trim() } },
      update: {},
      create: { userId: req.user.id, label: label.trim() },
    });
    res.status(201).json(interest);
  } catch (err) {
    console.error('[interests] POST error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/interests/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const interest = await prisma.userInterest.findUnique({ where: { id: req.params.id } });
    if (!interest) return res.status(404).json({ error: 'Não encontrado' });
    if (interest.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });

    await prisma.userInterest.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[interests] DELETE error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
