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

// POST /poke — body { messageId } OR { customText }
router.post('/poke', async (req, res) => {
  const body = req.body || {};
  const { messageId } = body;
  const customText = body.customText;
  const hasMessageId = messageId !== undefined && messageId !== null;
  const hasCustomText = customText !== undefined && customText !== null;

  // Validate input: must have one, not both
  if (!hasMessageId && !hasCustomText) {
    return res.status(400).json({ error: 'Missing messageId or customText' });
  }

  if (hasMessageId && hasCustomText) {
    return res.status(400).json({ error: 'Envie messageId OU customText, não os dois' });
  }

  let pokeTitle, pokeBody, pokeMessageId;

  // Path 1: messageId (existing behavior)
  if (hasMessageId) {
    const message = POKE_MESSAGES.find(m => m.id === messageId);
    if (!message) {
      return res.status(400).json({ error: 'Invalid messageId' });
    }
    pokeTitle = `${message.emoji} Cutucada`;
    pokeBody = message.text;
    pokeMessageId = messageId;
  }

  // Path 2: customText (new)
  if (hasCustomText) {
    const trimmed = (customText || '').toString().trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }
    if (trimmed.length > 140) {
      return res.status(400).json({ error: 'Mensagem muito longa (máx 140 caracteres)' });
    }
    pokeTitle = '💬 Cutucada';
    pokeBody = trimmed;
    pokeMessageId = null;
  }

  try {
    // Check rate limit: max 5 pokes per minute (applies to both paths)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = await prisma.notificationLog.count({
      where: {
        type: 'POKE',
        fromUserId: req.user.id,
        sentAt: { gte: oneMinuteAgo },
      },
    });

    if (recentCount >= 5) {
      return res.status(429).json({ error: 'Calma aí! Máximo de 5 cutucadas por minuto.' });
    }

    // Find the other user (assumes exactly 2 users in the system)
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const partnerId = allUsers.find(u => u.id !== req.user.id)?.id;
    if (!partnerId) {
      return res.status(500).json({ error: 'Partner user not found' });
    }

    // Send push notification
    await sendPushToUser(partnerId, {
      title: pokeTitle,
      body: pokeBody,
      tag: `poke-${Date.now()}`,
    });

    // Log the notification
    await prisma.notificationLog.create({
      data: {
        type: 'POKE',
        pokeMessageId,
        fromUserId: req.user.id,
        toUserId: partnerId,
        title: pokeTitle,
        body: pokeBody,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /push/poke error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to send poke' });
  }
});

// GET /notifications — returns 50 most recent notifications for user
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await prisma.notificationLog.findMany({
      where: { toUserId: req.user.id },
      select: { id: true, type: true, title: true, body: true, read: true, sentAt: true, fromUserId: true },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    console.error('GET /push/notifications error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to fetch notifications' });
  }
});

// GET /notifications/unread-count — returns count of unread notifications
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const count = await prisma.notificationLog.count({
      where: { toUserId: req.user.id, read: false },
    });
    res.json({ count });
  } catch (err) {
    console.error('GET /push/notifications/unread-count error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to fetch unread count' });
  }
});

// POST /notifications/:id/read — mark notification as read
router.post('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notificationLog.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.toUserId !== req.user.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notificationLog.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /push/notifications/:id/read error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to mark as read' });
  }
});

// POST /notifications/read-all — mark all unread notifications as read
router.post('/notifications/read-all', async (req, res) => {
  try {
    const result = await prisma.notificationLog.updateMany({
      where: { toUserId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ ok: true, count: result.count });
  } catch (err) {
    console.error('POST /push/notifications/read-all error:', err);
    res.status(422).json({ error: err?.message ?? 'Failed to mark as read' });
  }
});

module.exports = router;
