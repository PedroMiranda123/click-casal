jest.mock('../src/lib/prisma');
jest.mock('../src/services/groceryMatching');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const prisma = require('../src/lib/prisma');
const { matchItemsToOffers } = require('../src/services/groceryMatching');

const TEST_PASSWORD = 'hunter2';

async function loginAgent() {
  const user = {
    id: 'user-1',
    name: 'Pedro',
    email: 'pedro@test.com',
    passwordHash: await bcrypt.hash(TEST_PASSWORD, 12),
  };
  prisma.user.findUnique.mockResolvedValue(user);
  const agent = request.agent(app);
  await agent.post('/auth/login').send({ email: user.email, password: TEST_PASSWORD });
  return { agent, user };
}

function makeItem(overrides = {}) {
  return {
    id: 'item-1',
    userId: 'user-1',
    name: 'leite',
    checked: false,
    matchedOfferId: null,
    matchedAt: null,
    matchNote: null,
    matchedOffer: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  matchItemsToOffers.mockResolvedValue(undefined);
});

describe('GET /shopping-list', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/shopping-list');
    expect(res.status).toBe(401);
  });

  it('returns items for authenticated user', async () => {
    const { agent } = await loginAgent();
    prisma.shoppingListItem.findMany.mockResolvedValue([makeItem()]);
    const res = await agent.get('/shopping-list');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('leite');
  });
});

describe('POST /shopping-list', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/shopping-list').send({ name: 'ovos' });
    expect(res.status).toBe(401);
  });

  it('creates item and triggers background matching', async () => {
    const { agent } = await loginAgent();
    const item = makeItem({ name: 'ovos' });
    prisma.shoppingListItem.create.mockResolvedValue(item);
    prisma.shoppingListItem.findMany.mockResolvedValue([item]);

    const res = await agent.post('/shopping-list').send({ name: 'ovos' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('ovos');
  });

  it('rejects empty name', async () => {
    const { agent } = await loginAgent();
    const res = await agent.post('/shopping-list').send({ name: '' });
    expect(res.status).toBe(422);
  });

  it('rejects missing name', async () => {
    const { agent } = await loginAgent();
    const res = await agent.post('/shopping-list').send({});
    expect(res.status).toBe(422);
  });
});

describe('PATCH /shopping-list/:id', () => {
  it('requires auth', async () => {
    const res = await request(app).patch('/shopping-list/item-1').send({ checked: true });
    expect(res.status).toBe(401);
  });

  it('updates checked state', async () => {
    const { agent } = await loginAgent();
    const item = makeItem();
    prisma.shoppingListItem.findUnique.mockResolvedValue(item);
    prisma.shoppingListItem.update.mockResolvedValue({ ...item, checked: true });

    const res = await agent.patch('/shopping-list/item-1').send({ checked: true });
    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(true);
  });

  it('returns 404 for item belonging to another user', async () => {
    const { agent } = await loginAgent();
    prisma.shoppingListItem.findUnique.mockResolvedValue(makeItem({ userId: 'other-user' }));
    const res = await agent.patch('/shopping-list/item-1').send({ checked: true });
    expect(res.status).toBe(404);
  });

  it('returns 404 for missing item', async () => {
    const { agent } = await loginAgent();
    prisma.shoppingListItem.findUnique.mockResolvedValue(null);
    const res = await agent.patch('/shopping-list/item-1').send({ checked: true });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /shopping-list/:id', () => {
  it('requires auth', async () => {
    const res = await request(app).delete('/shopping-list/item-1');
    expect(res.status).toBe(401);
  });

  it('deletes owned item', async () => {
    const { agent } = await loginAgent();
    prisma.shoppingListItem.findUnique.mockResolvedValue(makeItem());
    prisma.shoppingListItem.delete.mockResolvedValue({});

    const res = await agent.delete('/shopping-list/item-1');
    expect(res.status).toBe(204);
  });

  it('returns 404 for item belonging to another user', async () => {
    const { agent } = await loginAgent();
    prisma.shoppingListItem.findUnique.mockResolvedValue(makeItem({ userId: 'other-user' }));
    const res = await agent.delete('/shopping-list/item-1');
    expect(res.status).toBe(404);
  });
});
