const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { signAccessToken, signRefreshToken, verifyToken } = require('../lib/jwt');
const {
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  setAccessCookie,
  clearAuthCookies,
} = require('../lib/cookies');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginRateLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  setAuthCookies(res, { accessToken, refreshToken });

  return res.status(200).json({ id: user.id, name: user.name, email: user.email });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (payload.type !== 'refresh') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const accessToken = signAccessToken(user.id);
  setAccessCookie(res, accessToken);

  return res.status(200).json({ ok: true });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  return res.status(200).json({ id: user.id, name: user.name, email: user.email });
});

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  return res.status(200).json({ ok: true });
});

module.exports = router;
