const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { expandOccurrences } = require('../lib/recurrence');
const { sendPushToUser } = require('../lib/webPush');

function startOfDayUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function sendReminder(event, stage) {
  const recipients = event.personId
    ? [event.personId]
    : (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);

  for (const toUserId of recipients) {
    const already = await prisma.notificationLog.findFirst({
      where: {
        type: 'EVENT_REMINDER',
        calendarEventId: event.id,
        reminderStage: stage,
        toUserId,
        sentAt: { gte: startOfDayUTC(new Date()) },
      },
    });
    if (already) continue;

    const title = stage === 'DAY_OF' ? `Hoje: ${event.title}` : `Amanhã: ${event.title}`;
    await sendPushToUser(toUserId, { title, body: event.title, tag: `event-${event.id}-${stage}` });

    await prisma.notificationLog.create({
      data: { type: 'EVENT_REMINDER', calendarEventId: event.id, reminderStage: stage, toUserId },
    });
  }
}

async function runReminderJob() {
  const today = startOfDayUTC(new Date());
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setUTCDate(dayAfterTomorrow.getUTCDate() + 1);

  const events = await prisma.calendarEvent.findMany();

  for (const event of events) {
    const todays = expandOccurrences(event, today, new Date(tomorrow.getTime() - 1));
    const tomorrows = expandOccurrences(event, tomorrow, new Date(dayAfterTomorrow.getTime() - 1));
    if (todays.length) await sendReminder(event, 'DAY_OF');
    if (tomorrows.length) await sendReminder(event, 'DAY_BEFORE');
  }
}

function startReminderCron() {
  cron.schedule('0 9 * * *', () => {
    runReminderJob().catch(err => console.error('[reminder-job] failed:', err.message));
  }, { timezone: 'Europe/Copenhagen' });
  console.log('[reminder-job] scheduled for 9am Europe/Copenhagen');
}

module.exports = { startReminderCron, runReminderJob };
