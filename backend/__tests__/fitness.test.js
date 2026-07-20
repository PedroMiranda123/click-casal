jest.mock('../src/lib/prisma');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const prisma = require('../src/lib/prisma');

const TEST_PASSWORD = 'hunter2';

const TEST_USER = {
  id: 'user-1',
  name: 'Pedro',
  email: 'pedro@test.com',
  passwordHash: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  TEST_USER.passwordHash = bcrypt.hashSync(TEST_PASSWORD, 12);
  prisma.user.findUnique.mockResolvedValue(TEST_USER);
  prisma.user.findMany = jest.fn();

  // Initialize workoutLog mock
  if (!prisma.workoutLog) {
    prisma.workoutLog = {};
  }
  prisma.workoutLog.findMany = jest.fn();
  prisma.workoutLog.findUnique = jest.fn();
  prisma.workoutLog.create = jest.fn();
  prisma.workoutLog.delete = jest.fn();

  // Initialize weeklyResult mock
  if (!prisma.weeklyResult) {
    prisma.weeklyResult = {};
  }
  prisma.weeklyResult.findUnique = jest.fn();
  prisma.weeklyResult.create = jest.fn();
  prisma.weeklyResult.groupBy = jest.fn();
  prisma.weeklyResult.findMany = jest.fn();
});

async function loginAgent() {
  const agent = request.agent(app);
  await agent.post('/auth/login').send({ email: TEST_USER.email, password: TEST_PASSWORD });
  return agent;
}

function makeWorkoutLog(overrides = {}) {
  return {
    id: 'log-1',
    personId: 'user-1',
    person: { id: 'user-1', name: 'Pedro' },
    type: 'CORRIDA',
    durationMinutes: 30,
    intensity: 'MODERADO',
    note: 'Quick run',
    date: new Date('2024-06-15T00:00:00.000Z'),
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('GET /fitness/logs — auth guard', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app).get('/fitness/logs');
    expect(res.status).toBe(401);
  });
});

describe('POST /fitness/logs — auth guard', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app).post('/fitness/logs').send({});
    expect(res.status).toBe(401);
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('POST /fitness/logs — validation', () => {
  it('rejects invalid type', async () => {
    const agent = await loginAgent();
    const res = await agent.post('/fitness/logs').send({
      type: 'INVALID_TYPE',
      date: '2024-06-15T00:00:00.000Z',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/type/);
  });

  it('rejects missing date', async () => {
    const agent = await loginAgent();
    const res = await agent.post('/fitness/logs').send({
      type: 'CORRIDA',
    });
    expect(res.status).toBe(400);
  });
});

// ─── Create workout ───────────────────────────────────────────────────────────

describe('POST /fitness/logs — create', () => {
  it('creates workout successfully', async () => {
    const agent = await loginAgent();
    const newLog = makeWorkoutLog();
    prisma.workoutLog.create.mockResolvedValue(newLog);

    const res = await agent.post('/fitness/logs').send({
      type: 'CORRIDA',
      durationMinutes: 30,
      intensity: 'MODERADO',
      note: 'Quick run',
      date: '2024-06-15T00:00:00.000Z',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('log-1');
    expect(res.body.type).toBe('CORRIDA');
    expect(prisma.workoutLog.create).toHaveBeenCalled();
  });

  it('allows optional fields', async () => {
    const agent = await loginAgent();
    const newLog = makeWorkoutLog({ type: 'YOGA', durationMinutes: null, intensity: null, note: null });
    prisma.workoutLog.create.mockResolvedValue(newLog);

    const res = await agent.post('/fitness/logs').send({
      type: 'YOGA',
      date: '2024-06-15T00:00:00.000Z',
    });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('YOGA');
  });
});

// ─── Delete workout ───────────────────────────────────────────────────────────

describe('DELETE /fitness/logs/:id', () => {
  it('returns 404 for non-existent log', async () => {
    const agent = await loginAgent();
    prisma.workoutLog.findUnique.mockResolvedValue(null);

    const res = await agent.delete('/fitness/logs/nonexistent');
    expect(res.status).toBe(404);
  });

  it('deletes existing log', async () => {
    const agent = await loginAgent();
    const log = makeWorkoutLog();
    prisma.workoutLog.findUnique.mockResolvedValue(log);
    prisma.workoutLog.delete.mockResolvedValue(log);

    const res = await agent.delete('/fitness/logs/log-1');
    expect(res.status).toBe(204);
    expect(prisma.workoutLog.delete).toHaveBeenCalledWith({ where: { id: 'log-1' } });
  });
});

// ─── Stats endpoint ───────────────────────────────────────────────────────────

describe('GET /fitness/stats', () => {
  it('returns expected shape', async () => {
    const agent = await loginAgent();

    // Mock user fetch
    prisma.user.findMany.mockResolvedValue([
      { id: 'pedro-id', email: process.env.SEED_USER_1_EMAIL || 'pedro@example.com' },
      { id: 'ana-id', email: process.env.SEED_USER_2_EMAIL || 'ana@example.com' },
    ]);

    // Mock workoutLog queries
    prisma.workoutLog.findMany.mockResolvedValue([]);

    // Mock weeklyResult operations
    prisma.weeklyResult.findUnique.mockResolvedValue(null);
    prisma.weeklyResult.create.mockResolvedValue({
      id: 'wr-1',
      weekStart: new Date(),
      countPedro: 5,
      countAna: 3,
      winnerId: 'pedro-id',
      createdAt: new Date(),
    });

    prisma.weeklyResult.groupBy.mockResolvedValue([
      { winnerId: 'pedro-id', _count: 2 },
      { winnerId: 'ana-id', _count: 1 },
    ]);

    prisma.weeklyResult.findMany.mockResolvedValue([
      {
        id: 'wr-1',
        weekStart: new Date(),
        countPedro: 5,
        countAna: 3,
        winnerId: 'pedro-id',
        winner: { id: 'pedro-id', name: 'Pedro' },
        createdAt: new Date(),
      },
    ]);

    const res = await agent.get('/fitness/stats');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('streaks');
    expect(res.body).toHaveProperty('currentWeek');
    expect(res.body).toHaveProperty('weeklyWins');
    expect(res.body).toHaveProperty('recentWeeklyResults');

    expect(res.body.streaks).toHaveProperty('pedro');
    expect(res.body.streaks).toHaveProperty('ana');
    expect(res.body.currentWeek).toHaveProperty('countPedro');
    expect(res.body.currentWeek).toHaveProperty('countAna');
    expect(res.body.weeklyWins).toHaveProperty('pedro');
    expect(res.body.weeklyWins).toHaveProperty('ana');
  });
});
