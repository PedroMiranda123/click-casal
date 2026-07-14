const { verifyToken } = require('../lib/jwt');
const { ACCESS_TOKEN_COOKIE } = require('../lib/cookies');

function authenticate(req, res, next) {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'access') {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

module.exports = authenticate;
