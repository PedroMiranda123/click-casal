const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { createEventSchema, updateEventSchema, listEventsSchema } = require('../validation/event');

const router = express.Router();

router.use(authenticate);

// Expand a single event into occurrences within [from, to]
function expandOccurrences(event, from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const startAt = new Date(event.startAt);

  if (event.recurrence === 'NONE') {
    if (startAt >= fromDate && startAt <= toDate) return [event];
    return [];
  }

  if (event.recurrence === 'YEARLY') {
    const results = [];
    const startYear = fromDate.getUTCFullYear();
    const endYear = toDate.getUTCFullYear();
    for (let year = startYear; year <= endYear; year++) {
      const occurrence = new Date(Date.UTC(year, startAt.getUTCMonth(), startAt.getUTCDate()));
      if (occurrence < startAt) continue; // before the event's origin date
      if (occurrence >= fromDate && occurrence <= toDate) {
        results.push({ ...event, startAt: occurrence });
      }
    }
    return results;
  }

  if (event.recurrence === 'WEEKLY') {
    const results = [];
    // Iterate UTC days so weekday computation is timezone-independent
    const current = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
    const end = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate()));
    while (current <= end) {
      const weekday = current.getUTCDay(); // 0=Sun..6=Sat
      if (current >= startAt && event.recurrenceDays.includes(weekday)) {
        results.push({ ...event, startAt: new Date(current) });
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return results;
  }

  return [];
}

// GET /events?from=ISO&to=ISO
router.get('/', async (req, res) => {
  const parsed = listEventsSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { from, to } = parsed.data;

  const events = await prisma.calendarEvent.findMany({
    include: {
      person: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'asc' },
  });

  const occurrences = events.flatMap(e => expandOccurrences(e, from, to));
  occurrences.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  res.json(occurrences);
});

// POST /events
router.post('/', async (req, res) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  try {
    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        type: data.type,
        personId: data.personId ?? null,
        startAt: new Date(data.startAt),
        allDay: data.allDay,
        recurrence: data.recurrence,
        recurrenceDays: data.recurrenceDays,
        description: data.description ?? null,
        createdById: req.user.id,
      },
      include: {
        person: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to create event' });
  }
});

// PATCH /events/:id
router.patch('/:id', async (req, res) => {
  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const existing = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    const data = { ...parsed.data };
    if (data.startAt) data.startAt = new Date(data.startAt);

    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data,
      include: {
        person: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(event);
  } catch (err) {
    console.error('PATCH /events error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to update event' });
  }
});

// DELETE /events/:id
router.delete('/:id', async (req, res) => {
  const existing = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  await prisma.calendarEvent.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;
