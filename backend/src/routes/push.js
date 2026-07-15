const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { sendPushToUser } = require('../lib/webPush');
const { POKE_MESSAGES } = require('../data/pokeMessages');

const router = express.Router();

router.use(authenticate);

// GET /poke-messages — returns POKE_MESSAGES (id, text, emoji only)
router.get('/poke-messages', (req, res) => {
  const messages = POKE_MESSAGES.map(({ id, text, emoji }) => ({ id, text, emoji }));
  res.json(messages);
});

// POST /subscribe — body { endpoint, keys: { p256dh, auth } }
router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Missing endpoint or keys' });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /push/subscribe error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to subscribe' });
  }
});

// POST /unsubscribe — body { endpoint }
router.post('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  try {
    const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    if (sub.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.pushSubscription.delete({ where: { endpoint } });
    res.status(204).end();
  } catch (err) {
    console.error('POST /push/unsubscribe error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to unsubscribe' });
  }
});

// POST /poke — body { messageId }
router.post('/poke', async (req, res) => {
  const { messageId } = req.body || {};

  if (!messageId) {
    return res.status(400).json({ error: 'Missing messageId' });
  }

  const message = POKE_MESSAGES.find(m => m.id === messageId);
  if (!message) {
    return res.status(400).json({ error: 'Invalid messageId' });
  }

  try {
    // Check rate limit: find most recent poke from this user in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.notificationLog.findFirst({
      where: {
        type: 'POKE',
        fromUserId: req.user.id,
        sentAt: { gte: oneHourAgo },
      },
      orderBy: { sentAt: 'desc' },
    });

    if (recent) {
      return res.status(429).json({ error: 'Você tá sendo inconveniente. Tente novamente daqui 1h' });
    }

    // Find the other user (assumes exactly 2 users in the system)
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const partnerId = allUsers.find(u => u.id !== req.user.id)?.id;
    if (!partnerId) {
      return res.status(500).json({ error: 'Partner user not found' });
    }

    // Send push notification
    await sendPushToUser(partnerId, {
      title: `${message.emoji} Cutucada`,
      body: message.text,
      tag: `poke-${Date.now()}`,
    });

    // Log the notification
    await prisma.notificationLog.create({
      data: {
        type: 'POKE',
        pokeMessageId: messageId,
        fromUserId: req.user.id,
        toUserId: partnerId,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /push/poke error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to send poke' });
  }
});

module.exports = router;
