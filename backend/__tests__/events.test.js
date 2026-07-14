jest.mock('../src/lib/prisma');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const prisma = require('../src/lib/prisma');

// Pull the expansion logic out by requiring the route module after mocking
// (we test expansion via the GET /events endpoint)

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
  return agent;
}

function makeEvent(overrides = {}) {
  return {
    id: 'evt-1',
    title: 'Test',
    type: 'GENERAL',
    personId: null,
    person: null,
    startAt: new Date('2024-06-15T00:00:00.000Z'),
    allDay: true,
    recurrence: 'NONE',
    recurrenceDays: [],
    description: null,
    createdById: 'user-1',
    createdBy: { id: 'user-1', name: 'Pedro' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('GET /events — auth guard', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app)
      .get('/events')
      .query({ from: '2024-01-01T00:00:00.000Z', to: '2024-12-31T23:59:59.999Z' });
    expect(res.status).toBe(401);
  });
});

describe('POST /events — auth guard', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app).post('/events').send({});
    expect(res.status).toBe(401);
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('POST /events — validation', () => {
  it('rejects missing title', async () => {
    const agent = await loginAgent();
    const res = await agent.post('/events').send({
      type: 'GENERAL',
      startAt: '2024-06-15T00:00:00.000Z',
    });
    expect(res.status).toBe(400);
  });

  it('rejects WEEKLY recurrence without recurrenceDays', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.create.mockResolvedValue(makeEvent());
    const res = await agent.post('/events').send({
      title: 'Run',
      type: 'EXERCISE',
      startAt: '2024-01-01T00:00:00.000Z',
      recurrence: 'WEEKLY',
      recurrenceDays: [],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/recurrenceDays/);
  });

  it('rejects recurrenceDays with non-WEEKLY recurrence', async () => {
    const agent = await loginAgent();
    const res = await agent.post('/events').send({
      title: 'Birthday',
      type: 'BIRTHDAY',
      startAt: '2024-06-15T00:00:00.000Z',
      recurrence: 'YEARLY',
      recurrenceDays: [1],
    });
    expect(res.status).toBe(400);
  });
});

// ─── Occurrence expansion — NONE ─────────────────────────────────────────────

describe('GET /events — NONE recurrence', () => {
  it('includes event when startAt is in range', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.findMany.mockResolvedValue([makeEvent()]);
    const res = await agent.get('/events').query({
      from: '2024-06-01T00:00:00.000Z',
      to: '2024-06-30T23:59:59.999Z',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('excludes event when startAt is outside range', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.findMany.mockResolvedValue([makeEvent()]);
    const res = await agent.get('/events').query({
      from: '2024-07-01T00:00:00.000Z',
      to: '2024-07-31T23:59:59.999Z',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ─── Occurrence expansion — YEARLY ───────────────────────────────────────────

describe('GET /events — YEARLY recurrence', () => {
  it('returns one occurrence per year in range', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.findMany.mockResolvedValue([
      makeEvent({ recurrence: 'YEARLY', startAt: new Date('2022-03-10T00:00:00.000Z') }),
    ]);
    const res = await agent.get('/events').query({
      from: '2022-01-01T00:00:00.000Z',
      to: '2024-12-31T23:59:59.999Z',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3); // 2022, 2023, 2024
  });

  it('does not include years before startAt', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.findMany.mockResolvedValue([
      makeEvent({ recurrence: 'YEARLY', startAt: new Date('2024-06-15T00:00:00.000Z') }),
    ]);
    // Query spans 2023–2025 but event started in 2024
    const res = await agent.get('/events').query({
      from: '2023-01-01T00:00:00.000Z',
      to: '2025-12-31T23:59:59.999Z',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2); // 2024, 2025 only
  });

  it('handles year boundary correctly (Dec 31 event)', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.findMany.mockResolvedValue([
      makeEvent({ recurrence: 'YEARLY', startAt: new Date('2020-12-31T00:00:00.000Z') }),
    ]);
    const res = await agent.get('/events').query({
      from: '2023-12-01T00:00:00.000Z',
      to: '2024-01-15T23:59:59.999Z',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1); // only Dec 31 2023
    expect(new Date(res.body[0].startAt).getFullYear()).toBe(2023);
  });
});

// ─── Occurrence expansion — WEEKLY ───────────────────────────────────────────

describe('GET /events — WEEKLY recurrence', () => {
  it('returns one entry per matching weekday in range', async () => {
    const agent = await loginAgent();
    // Monday=1, Wednesday=3; range is Mon–Sun (7 days starting 2024-01-01 = Monday)
    prisma.calendarEvent.findMany.mockResolvedValue([
      makeEvent({
        recurrence: 'WEEKLY',
        recurrenceDays: [1, 3],
        startAt: new Date('2023-01-01T00:00:00.000Z'),
      }),
    ]);
    const res = await agent.get('/events').query({
      from: '2024-01-01T00:00:00.000Z', // Monday
      to: '2024-01-07T23:59:59.999Z',   // Sunday
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2); // Mon Jan 1, Wed Jan 3
  });

  it('does not include days before startAt', async () => {
    const agent = await loginAgent();
    // Event starts on Wednesday 2024-01-03; recurs every Mon+Wed
    prisma.calendarEvent.findMany.mockResolvedValue([
      makeEvent({
        recurrence: 'WEEKLY',
        recurrenceDays: [1, 3],
        startAt: new Date('2024-01-03T00:00:00.000Z'), // Wednesday
      }),
    ]);
    // Range covers Mon Jan 1 and Wed Jan 3
    const res = await agent.get('/events').query({
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-01-07T23:59:59.999Z',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1); // only Wed Jan 3 (Mon Jan 1 is before startAt)
  });

  it('handles range edge: event on last day of range', async () => {
    const agent = await loginAgent();
    // Every Saturday=6
    prisma.calendarEvent.findMany.mockResolvedValue([
      makeEvent({
        recurrence: 'WEEKLY',
        recurrenceDays: [6],
        startAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
    ]);
    // 2024-01-06 is Saturday — exactly at to boundary
    const res = await agent.get('/events').query({
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-01-06T23:59:59.999Z',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ─── CRUD happy paths ─────────────────────────────────────────────────────────

describe('POST /events — create', () => {
  it('creates a NONE recurrence event', async () => {
    const agent = await loginAgent();
    const created = makeEvent({ title: 'Dentist', type: 'GENERAL' });
    prisma.calendarEvent.create.mockResolvedValue(created);

    const res = await agent.post('/events').send({
      title: 'Dentist',
      type: 'GENERAL',
      startAt: '2024-06-15T09:00:00.000Z',
      allDay: false,
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Dentist');
  });
});

describe('DELETE /events/:id', () => {
  it('returns 404 for unknown event', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.findUnique.mockResolvedValue(null);
    const res = await agent.delete('/events/nonexistent');
    expect(res.status).toBe(404);
  });

  it('deletes existing event', async () => {
    const agent = await loginAgent();
    prisma.calendarEvent.findUnique.mockResolvedValue(makeEvent());
    prisma.calendarEvent.delete.mockResolvedValue({});
    const res = await agent.delete('/events/evt-1');
    expect(res.status).toBe(204);
  });
});
