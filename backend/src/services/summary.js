const prisma = require('../lib/prisma');
const { getBalanceDkk } = require('./balance');

function parseMonth(monthStr) {
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr || '');
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

async function getCategoryBreakdown(start, end) {
  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      type: 'EXPENSE',
      categoryId: { not: null },
      occurredAt: { gte: start, lt: end },
    },
    _sum: { amountDkk: true },
  });

  if (grouped.length === 0) {
    return [];
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
  });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return grouped.map((g) => ({
    categoryId: g.categoryId,
    categoryName: categoryById.get(g.categoryId)?.name ?? 'Unknown',
    totalDkk: g._sum.amountDkk ?? 0,
  }));
}

async function getDailyTimeline(start, end) {
  const dailyNetRows = await prisma.$queryRaw`
    SELECT
      ("occurredAt" AT TIME ZONE 'UTC')::date AS day,
      SUM(CASE WHEN "type" = 'INCOME' THEN "amountDkk" ELSE -"amountDkk" END)::bigint AS net
    FROM "Transaction"
    WHERE "occurredAt" >= ${start} AND "occurredAt" < ${end}
    GROUP BY day
  `;

  const netByDay = new Map(
    dailyNetRows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.net)])
  );

  let running = await getBalanceDkk({ before: start });

  const timeline = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    running += netByDay.get(dateKey) ?? 0;
    timeline.push({ date: dateKey, balanceDkk: running });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return timeline;
}

async function getMonthlySummary(monthStr) {
  const range = parseMonth(monthStr);
  if (!range) {
    return null;
  }

  const [categoryBreakdown, dailyTimeline] = await Promise.all([
    getCategoryBreakdown(range.start, range.end),
    getDailyTimeline(range.start, range.end),
  ]);

  return { categoryBreakdown, dailyTimeline };
}

module.exports = { getMonthlySummary };
