'use strict';

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticate = require('../middleware/authenticate');

// GET /api/event-suggestions — return suggestions relevant to current user, newest first
// Query params: kind=EVENT|MOVIE, status=NEW|DISMISSED|ADDED
router.get('/', authenticate, async (req, res) => {
  const { kind, status } = req.query;

  const VALID_KINDS = ['EVENT', 'MOVIE'];
  const VALID_STATUSES = ['NEW', 'DISMISSED', 'ADDED'];

  if (kind && !VALID_KINDS.includes(kind)) return res.status(400).json({ error: 'kind inválido' });
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'status inválido' });

  try {
    const showAll = !status;
    const suggestions = await prisma.eventSuggestion.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(kind ? { kind } : {}),
        ...(showAll ? {} : { relevances: { some: { userId: req.user.id } } }),
      },
      include: {
        relevances: {
          where: { userId: req.user.id },
          select: { reason: true },
        },
      },
      orderBy: { startAt: 'asc' },
      take: 50,
    });

    const result = suggestions.map(s => ({
      id: s.id,
      source: s.source,
      title: s.title,
      description: s.description,
      venueName: s.venueName,
      city: s.city,
      startAt: s.startAt,
      url: s.url,
      imageUrl: s.imageUrl,
      category: s.category,
      kind: s.kind,
      status: s.status,
      reason: s.relevances[0]?.reason ?? null,
      createdAt: s.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('[event-suggestions] GET error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/event-suggestions/:id/status — update status (DISMISSED or ADDED)
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const VALID_STATUSES = ['DISMISSED', 'ADDED'];
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'status inválido' });

  try {
    // Verify this suggestion is relevant to the requesting user
    const relevance = await prisma.eventSuggestionRelevance.findUnique({
      where: { eventSuggestionId_userId: { eventSuggestionId: req.params.id, userId: req.user.id } },
    });
    if (!relevance) return res.status(404).json({ error: 'Não encontrado' });

    // Status is global on the suggestion (both users see the same status)
    // This is intentional — if Pedro adds it, it's added for both; they coordinate.
    const updated = await prisma.eventSuggestion.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ ok: true, status: updated.status });
  } catch (err) {
    console.error('[event-suggestions] PATCH error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
