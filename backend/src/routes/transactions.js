const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { transactionInputSchema, formatZodError } = require('../validation/transaction');
const { getRate, ExchangeRateUnavailableError } = require('../services/exchangeRate');
const { getMonthlySummary } = require('../services/summary');

const router = express.Router();

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

function parsePagination(query) {
  let page = parseInt(query.page, 10);
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  limit = Math.min(limit, MAX_LIMIT);

  return { page, limit };
}

function parseListFilters(query) {
  const where = {};

  if (query.from || query.to) {
    where.occurredAt = {};
    if (query.from) {
      const from = new Date(query.from);
      if (!Number.isNaN(from.getTime())) {
        where.occurredAt.gte = from;
      }
    }
    if (query.to) {
      const to = new Date(query.to);
      if (!Number.isNaN(to.getTime())) {
        where.occurredAt.lte = to;
      }
    }
  }
  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }
  if (query.paymentMethodId) {
    where.paymentMethodId = query.paymentMethodId;
  }
  if (query.type === 'INCOME' || query.type === 'EXPENSE') {
    where.type = query.type;
  }

  return where;
}

async function validateReferences(data) {
  const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: data.paymentMethodId } });
  if (!paymentMethod || !paymentMethod.isActive) {
    return [{ field: 'paymentMethodId', message: 'Payment method not found or inactive' }];
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      return [{ field: 'categoryId', message: 'Category not found' }];
    }
  }

  return null;
}

async function resolveAmountDkk(data) {
  if (data.originalCurrency === 'DKK') {
    return { amountDkk: data.originalAmount, exchangeRate: null };
  }

  const rate = await getRate(data.occurredAt, data.originalCurrency, 'DKK');
  return { amountDkk: Math.round(data.originalAmount * rate), exchangeRate: rate };
}

router.post('/', authenticate, async (req, res) => {
  const parsed = transactionInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
  }
  const data = parsed.data;

  const referenceErrors = await validateReferences(data);
  if (referenceErrors) {
    return res.status(400).json({ error: 'Validation failed', details: referenceErrors });
  }

  let amountDkk;
  let exchangeRate;
  try {
    ({ amountDkk, exchangeRate } = await resolveAmountDkk(data));
  } catch (err) {
    if (err instanceof ExchangeRateUnavailableError) {
      return res.status(422).json({ error: "Couldn't get an exchange rate for this date, try again shortly" });
    }
    throw err;
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user.id,
      paymentMethodId: data.paymentMethodId,
      categoryId: data.categoryId ?? null,
      type: data.type,
      originalAmount: data.originalAmount,
      originalCurrency: data.originalCurrency,
      amountDkk,
      exchangeRate,
      description: data.description ?? null,
      occurredAt: data.occurredAt,
    },
  });

  return res.status(201).json(transaction);
});

router.get('/', authenticate, async (req, res) => {
  const where = parseListFilters(req.query);
  const { page, limit } = parsePagination(req.query);

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return res.status(200).json({ data, pagination: { page, limit, total } });
});

router.get('/summary', authenticate, async (req, res) => {
  const summary = await getMonthlySummary(req.query.month);
  if (!summary) {
    return res.status(400).json({ error: 'Invalid or missing month query param, expected format YYYY-MM' });
  }
  return res.status(200).json(summary);
});

router.get('/:id', authenticate, async (req, res) => {
  const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  return res.status(200).json(transaction);
});

router.patch('/:id', authenticate, async (req, res) => {
  const existing = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const merged = {
    type: req.body.type ?? existing.type,
    originalAmount: req.body.originalAmount ?? existing.originalAmount,
    originalCurrency: req.body.originalCurrency ?? existing.originalCurrency,
    paymentMethodId: req.body.paymentMethodId ?? existing.paymentMethodId,
    categoryId: Object.prototype.hasOwnProperty.call(req.body, 'categoryId')
      ? req.body.categoryId
      : existing.categoryId,
    occurredAt: req.body.occurredAt ?? existing.occurredAt,
    description: Object.prototype.hasOwnProperty.call(req.body, 'description')
      ? req.body.description
      : existing.description,
  };

  const parsed = transactionInputSchema.safeParse(merged);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
  }
  const data = parsed.data;

  const referenceErrors = await validateReferences(data);
  if (referenceErrors) {
    return res.status(400).json({ error: 'Validation failed', details: referenceErrors });
  }

  let amountDkk;
  let exchangeRate;
  try {
    ({ amountDkk, exchangeRate } = await resolveAmountDkk(data));
  } catch (err) {
    if (err instanceof ExchangeRateUnavailableError) {
      return res.status(422).json({ error: "Couldn't get an exchange rate for this date, try again shortly" });
    }
    throw err;
  }

  const updated = await prisma.transaction.update({
    where: { id: req.params.id },
    data: {
      type: data.type,
      originalAmount: data.originalAmount,
      originalCurrency: data.originalCurrency,
      paymentMethodId: data.paymentMethodId,
      categoryId: data.categoryId ?? null,
      occurredAt: data.occurredAt,
      description: data.description ?? null,
      amountDkk,
      exchangeRate,
    },
  });

  return res.status(200).json(updated);
});

router.delete('/:id', authenticate, async (req, res) => {
  const existing = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  await prisma.transaction.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

module.exports = router;
