jest.mock('../src/lib/prisma');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const prisma = require('../src/lib/prisma');

const TEST_PASSWORD = 'correct-horse-battery-staple';

async function loginAgent() {
  const user = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: await bcrypt.hash(TEST_PASSWORD, 12),
  };
  prisma.user.findUnique.mockResolvedValue(user);

  const agent = request.agent(app);
  await agent.post('/auth/login').send({ email: user.email, password: TEST_PASSWORD });
  return agent;
}

const ACTIVE_PAYMENT_METHOD = { id: 'pm-1', name: 'Lunar', type: 'DEBIT', isActive: true };
const CATEGORY = { id: 'cat-1', name: 'Supermercado', icon: 'shopping-cart', color: '#4CAF50', isDefault: true };

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe('POST /transactions', () => {
  it('creates a DKK expense with no currency conversion', async () => {
    const agent = await loginAgent();
    prisma.paymentMethod.findUnique.mockResolvedValue(ACTIVE_PAYMENT_METHOD);
    prisma.category.findUnique.mockResolvedValue(CATEGORY);
    prisma.transaction.create.mockImplementation(({ data }) => Promise.resolve({ id: 'tx-1', ...data }));

    const res = await agent.post('/transactions').send({
      type: 'EXPENSE',
      originalAmount: 15000,
      originalCurrency: 'DKK',
      paymentMethodId: ACTIVE_PAYMENT_METHOD.id,
      categoryId: CATEGORY.id,
      occurredAt: '2026-06-01',
    });

    expect(res.status).toBe(201);
    expect(res.body.amountDkk).toBe(15000);
    expect(res.body.exchangeRate).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('creates a BRL expense and applies the mocked exchange rate', async () => {
    const agent = await loginAgent();
    prisma.paymentMethod.findUnique.mockResolvedValue(ACTIVE_PAYMENT_METHOD);
    prisma.category.findUnique.mockResolvedValue(CATEGORY);
    prisma.exchangeRate.findUnique.mockResolvedValue(null);
    prisma.exchangeRate.upsert.mockResolvedValue({ rate: 1.25 });
    prisma.transaction.create.mockImplementation(({ data }) => Promise.resolve({ id: 'tx-2', ...data }));

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ amount: 1, base: 'BRL', date: '2026-06-01', rates: { DKK: 1.25 } }),
    });

    const res = await agent.post('/transactions').send({
      type: 'EXPENSE',
      originalAmount: 10000,
      originalCurrency: 'BRL',
      paymentMethodId: ACTIVE_PAYMENT_METHOD.id,
      categoryId: CATEGORY.id,
      occurredAt: '2026-06-01',
    });

    expect(res.status).toBe(201);
    expect(res.body.amountDkk).toBe(12500);
    expect(res.body.exchangeRate).toBe(1.25);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects an EXPENSE with no categoryId', async () => {
    const agent = await loginAgent();

    const res = await agent.post('/transactions').send({
      type: 'EXPENSE',
      originalAmount: 5000,
      originalCurrency: 'DKK',
      paymentMethodId: ACTIVE_PAYMENT_METHOD.id,
      occurredAt: '2026-06-01',
    });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'categoryId')).toBe(true);
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});

describe('PATCH /transactions/:id', () => {
  it('recomputes amountDkk and exchangeRate from scratch when currency changes', async () => {
    const agent = await loginAgent();
    const existing = {
      id: 'tx-3',
      type: 'EXPENSE',
      originalAmount: 15000,
      originalCurrency: 'DKK',
      amountDkk: 15000,
      exchangeRate: null,
      paymentMethodId: ACTIVE_PAYMENT_METHOD.id,
      categoryId: CATEGORY.id,
      description: null,
      occurredAt: new Date('2026-06-01'),
    };
    prisma.transaction.findUnique.mockResolvedValue(existing);
    prisma.paymentMethod.findUnique.mockResolvedValue(ACTIVE_PAYMENT_METHOD);
    prisma.category.findUnique.mockResolvedValue(CATEGORY);
    prisma.exchangeRate.findUnique.mockResolvedValue(null);
    prisma.exchangeRate.upsert.mockResolvedValue({ rate: 1.25 });
    prisma.transaction.update.mockImplementation(({ data }) => Promise.resolve({ id: 'tx-3', ...data }));

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ amount: 1, base: 'BRL', date: '2026-06-01', rates: { DKK: 1.25 } }),
    });

    const res = await agent.patch('/transactions/tx-3').send({
      originalAmount: 20000,
      originalCurrency: 'BRL',
    });

    expect(res.status).toBe(200);
    expect(res.body.amountDkk).toBe(25000);
    expect(res.body.exchangeRate).toBe(1.25);
  });

  it('returns 404 for a non-existent transaction', async () => {
    const agent = await loginAgent();
    prisma.transaction.findUnique.mockResolvedValue(null);

    const res = await agent.patch('/transactions/does-not-exist').send({ originalAmount: 100 });

    expect(res.status).toBe(404);
  });
});

describe('GET /balance', () => {
  it('computes the balance via a SQL aggregate mix of income and expense', async () => {
    const agent = await loginAgent();
    prisma.$queryRaw.mockResolvedValue([{ balance: 8000 }]);

    const res = await agent.get('/balance');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ balanceDkk: 8000 });
  });
});

describe('GET /transactions/summary', () => {
  it('returns categoryBreakdown and a running dailyTimeline', async () => {
    const agent = await loginAgent();

    prisma.transaction.groupBy.mockResolvedValue([{ categoryId: CATEGORY.id, _sum: { amountDkk: 5000 } }]);
    prisma.category.findMany.mockResolvedValue([CATEGORY]);

    prisma.$queryRaw
      .mockResolvedValueOnce([
        { day: new Date('2026-07-01T00:00:00.000Z'), net: 1000 },
        { day: new Date('2026-07-15T00:00:00.000Z'), net: -200 },
      ])
      .mockResolvedValueOnce([{ balance: 5000 }]);

    const res = await agent.get('/transactions/summary?month=2026-07');

    expect(res.status).toBe(200);
    expect(res.body.categoryBreakdown).toEqual([
      { categoryId: CATEGORY.id, categoryName: CATEGORY.name, totalDkk: 5000 },
    ]);
    expect(res.body.dailyTimeline).toHaveLength(31);
    expect(res.body.dailyTimeline[0]).toEqual({ date: '2026-07-01', balanceDkk: 6000 });
    expect(res.body.dailyTimeline[14]).toEqual({ date: '2026-07-15', balanceDkk: 5800 });
    expect(res.body.dailyTimeline[30]).toEqual({ date: '2026-07-31', balanceDkk: 5800 });
  });

  it('rejects a missing or malformed month param', async () => {
    const agent = await loginAgent();

    const res = await agent.get('/transactions/summary');

    expect(res.status).toBe(400);
  });
});

describe('authentication is required on every new endpoint', () => {
  const cases = [
    ['post', '/transactions'],
    ['get', '/transactions'],
    ['get', '/transactions/tx-1'],
    ['patch', '/transactions/tx-1'],
    ['delete', '/transactions/tx-1'],
    ['get', '/transactions/summary?month=2026-07'],
    ['get', '/balance'],
    ['get', '/categories'],
    ['get', '/payment-methods'],
  ];

  it.each(cases)('%s %s returns 401 without a session', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });
});
