'use strict';

const cron = require('node-cron');
const prisma = require('../lib/prisma');

async function runCleanupJob() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const { count } = await prisma.eventSuggestion.deleteMany({
      where: { startAt: { lt: startOfToday } },
    });
    console.log(`[cleanup-cron] deleted ${count} past event suggestions`);
    return { deleted: count };
  } catch (err) {
    console.error('[cleanup-cron] job failed:', err.message);
    return { error: err.message };
  }
}

function startCleanupCron() {
  cron.schedule('0 3 * * 1', () => {
    runCleanupJob().catch(err => console.error('[cleanup-cron] uncaught error:', err.message));
  }, { timezone: 'Europe/Copenhagen' });
  console.log('[cleanup-cron] scheduled for 3am Monday Europe/Copenhagen');
}

module.exports = { startCleanupCron, runCleanupJob };
