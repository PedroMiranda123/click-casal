const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushToUser(userId, payload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  await Promise.all(
    results.map((r, i) => {
      if (r.status === 'rejected' && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404)) {
        return prisma.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {});
      }
      return null;
    })
  );

  return results;
}

module.exports = { sendPushToUser };
