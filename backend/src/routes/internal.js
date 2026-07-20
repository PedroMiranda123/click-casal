'use strict';

// Internal job trigger — called by Dokploy Schedules (cron)
// Protected by INTERNAL_JOB_SECRET header, not by user auth.
// Set this up in Dokploy: Schedules → HTTP → POST https://api.clickcasal.com.br/api/internal/run-discovery
// with header Authorization: Bearer <INTERNAL_JOB_SECRET>

const express = require('express');
const router = express.Router();
const { runDiscovery } = require('../services/discovery/runDiscovery');

function requireJobSecret(req, res, next) {
  const secret = process.env.INTERNAL_JOB_SECRET;
  if (!secret) {
    console.error('[internal] INTERNAL_JOB_SECRET not set — rejecting request');
    return res.status(503).json({ error: 'Job secret not configured' });
  }
  const auth = req.headers.authorization ?? '';
  if (auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/run-discovery', requireJobSecret, async (req, res) => {
  console.log('[internal] run-discovery triggered');
  // Respond immediately, run job async so the HTTP request doesn't time out
  res.json({ ok: true, message: 'Discovery job started' });
  try {
    await runDiscovery();
  } catch (err) {
    console.error('[internal] runDiscovery threw:', err.message);
  }
});

module.exports = router;
