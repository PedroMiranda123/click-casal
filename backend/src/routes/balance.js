const express = require('express');
const authenticate = require('../middleware/authenticate');
const { getBalanceDkk } = require('../services/balance');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const balanceDkk = await getBalanceDkk();
  return res.status(200).json({ balanceDkk });
});

module.exports = router;
