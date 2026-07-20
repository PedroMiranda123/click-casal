const prisma = require('../lib/prisma');

// Get Monday of the week containing date (UTC-based, date-only)
function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  return monday;
}

// Get the Monday of the current week (UTC-based)
function getCurrentWeekMonday() {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return getMondayOfWeek(todayUTC);
}

// Get the Monday of the previous (last completed) week (UTC-based)
function getLastWeekMonday() {
  const current = getCurrentWeekMonday();
  return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() - 7));
}

// getStreak(personId): consecutive days (including today or yesterday) with at least one WorkoutLog (UTC-based)
async function getStreak(personId) {
  const logs = await prisma.workoutLog.findMany({
    where: { personId },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (logs.length === 0) return { current: 0, best: 0 };

  const uniqueDates = Array.from(new Set(logs.map(l => {
    const d = new Date(l.date);
    return d.toISOString().split('T')[0];
  })));

  let current = 0;
  let best = 0;

  // Compute today's UTC date
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayStr = todayUTC.toISOString().split('T')[0];

  // Compute yesterday's UTC date
  const yesterdayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const yesterdayStr = yesterdayUTC.toISOString().split('T')[0];

  // Count current streak (today or yesterday, going backward)
  let checkDate = uniqueDates[0];
  if (checkDate === todayStr || checkDate === yesterdayStr) {
    current = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDateStr = uniqueDates[i - 1];
      const prevDate = new Date(prevDateStr + 'T00:00:00Z');
      const prevDateMinusOne = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth(), prevDate.getUTCDate() - 1));
      const prevDateMinusOneStr = prevDateMinusOne.toISOString().split('T')[0];
      if (prevDateMinusOneStr === uniqueDates[i]) {
        current++;
      } else {
        break;
      }
    }
  }

  // Compute best streak
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDateStr = uniqueDates[i - 1];
    const prevDate = new Date(prevDateStr + 'T00:00:00Z');
    const prevDateMinusOne = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth(), prevDate.getUTCDate() - 1));
    const prevDateMinusOneStr = prevDateMinusOne.toISOString().split('T')[0];
    if (prevDateMinusOneStr === uniqueDates[i]) {
      streak++;
    } else {
      best = Math.max(best, streak);
      streak = 1;
    }
  }
  best = Math.max(best, streak, current);

  return { current, best };
}

// getCurrentWeekCounts(pedroId, anaId): counts for both people for current week (Mon-Sun, UTC-based)
async function getCurrentWeekCounts(pedroId, anaId) {
  const weekMonday = getCurrentWeekMonday();
  const weekSunday = new Date(Date.UTC(weekMonday.getUTCFullYear(), weekMonday.getUTCMonth(), weekMonday.getUTCDate() + 6, 23, 59, 59, 999));

  const logs = await prisma.workoutLog.findMany({
    where: {
      date: {
        gte: weekMonday,
        lte: weekSunday,
      },
    },
    select: { personId: true },
  });

  const countPedro = logs.filter(l => l.personId === pedroId).length;
  const countAna = logs.filter(l => l.personId === anaId).length;

  return { countPedro, countAna };
}

// ensureWeeklyResultsClosed(pedroId, anaId): ensure last completed week has a WeeklyResult (UTC-based)
async function ensureWeeklyResultsClosed(pedroId, anaId) {
  const lastWeekMonday = getLastWeekMonday();
  const lastWeekSunday = new Date(Date.UTC(lastWeekMonday.getUTCFullYear(), lastWeekMonday.getUTCMonth(), lastWeekMonday.getUTCDate() + 6, 23, 59, 59, 999));

  const existing = await prisma.weeklyResult.findUnique({
    where: { weekStart: lastWeekMonday },
  });

  if (existing) return existing;

  // Count logs for last week
  const logs = await prisma.workoutLog.findMany({
    where: {
      date: {
        gte: lastWeekMonday,
        lte: lastWeekSunday,
      },
    },
    select: { personId: true },
  });

  const countPedro = logs.filter(l => l.personId === pedroId).length;
  const countAna = logs.filter(l => l.personId === anaId).length;

  let winnerId = null;
  if (countPedro > countAna) {
    winnerId = pedroId;
  } else if (countAna > countPedro) {
    winnerId = anaId;
  }
  // else: tie, winnerId stays null

  return prisma.weeklyResult.create({
    data: {
      weekStart: lastWeekMonday,
      countPedro,
      countAna,
      winnerId,
    },
  });
}

// getWeeklyWinCounts(): count wins by person
async function getWeeklyWinCounts() {
  const results = await prisma.weeklyResult.groupBy({
    by: ['winnerId'],
    _count: true,
  });

  const wins = {};
  for (const group of results) {
    if (group.winnerId) {
      wins[group.winnerId] = group._count;
    }
  }

  return wins;
}

module.exports = {
  getStreak,
  getCurrentWeekCounts,
  ensureWeeklyResultsClosed,
  getWeeklyWinCounts,
};
