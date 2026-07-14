const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return res.status(200).json(categories);
});

module.exports = router;
