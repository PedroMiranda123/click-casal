const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { createWorkoutSchema } = require('../validation/workout');
const { getStreak, getCurrentWeekCounts, ensureWeeklyResultsClosed, getWeeklyWinCounts } = require('../services/fitness');

const router = express.Router();

router.use(authenticate);

// Helper to get Pedro and Ana IDs by email (cached in route handler)
let cachedUsers = null;

async function getUserIds() {
  if (cachedUsers) return cachedUsers;
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [process.env.SEED_USER_1_EMAIL, process.env.SEED_USER_2_EMAIL],
      },
    },
    select: { id: true, email: true },
  });
  const pedro = users.find(u => u.email === process.env.SEED_USER_1_EMAIL);
  const ana = users.find(u => u.email === process.env.SEED_USER_2_EMAIL);
  if (!pedro || !ana) throw new Error('Could not find Pedro or Ana');
  cachedUsers = { pedroId: pedro.id, anaId: ana.id };
  return cachedUsers;
}

// GET /fitness/logs?personId=&from=&to=
router.get('/logs', async (req, res) => {
  try {
    const { personId, from, to } = req.query;
    const where = {};

    if (personId) where.personId = personId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const logs = await prisma.workoutLog.findMany({
      where,
      include: { person: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });

    res.json(logs);
  } catch (err) {
    console.error('GET /fitness/logs error:', err);
    res.status(400).json({ error: err?.message ?? 'Failed to list logs' });
  }
});

// POST /fitness/logs
router.post('/logs', async (req, res) => {
  const parsed = createWorkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const data = parsed.data;
    const log = await prisma.workoutLog.create({
      data: {
        personId: req.user.id,
        type: data.type,
        durationMinutes: data.durationMinutes ?? null,
        intensity: data.intensity ?? null,
        note: data.note ?? null,
        date: new Date(data.date),
      },
      include: { person: { select: { id: true, name: true } } },
    });
    res.status(201).json(log);
  } catch (err) {
    console.error('POST /fitness/logs error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to create log' });
  }
});

// DELETE /fitness/logs/:id
router.delete('/logs/:id', async (req, res) => {
  try {
    const existing = await prisma.workoutLog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Workout log not found' });

    await prisma.workoutLog.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /fitness/logs/:id error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to delete log' });
  }
});

// GET /fitness/stats
router.get('/stats', async (req, res) => {
  try {
    const { pedroId, anaId } = await getUserIds();

    // Close last week's results if not already done
    await ensureWeeklyResultsClosed(pedroId, anaId);

    // Get streaks for both
    const pedroBoth = await getStreak(pedroId);
    const anaBoth = await getStreak(anaId);

    // Get current week counts
    const currentWeek = await getCurrentWeekCounts(pedroId, anaId);

    // Get all-time week wins
    const allWins = await getWeeklyWinCounts();

    // Get recent weekly results (last ~8 weeks)
    const recentWeeklyResults = await prisma.weeklyResult.findMany({
      orderBy: { weekStart: 'desc' },
      take: 8,
      include: { winner: { select: { id: true, name: true } } },
    });

    res.json({
      streaks: {
        pedro: pedroBoth,
        ana: anaBoth,
      },
      currentWeek,
      weeklyWins: {
        pedro: allWins[pedroId] || 0,
        ana: allWins[anaId] || 0,
      },
      recentWeeklyResults: recentWeeklyResults.reverse(),
    });
  } catch (err) {
    console.error('GET /fitness/stats error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to fetch stats' });
  }
});

module.exports = router;
