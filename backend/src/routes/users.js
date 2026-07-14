const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

// GET /users — list all users (for person selector)
router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

module.exports = router;
