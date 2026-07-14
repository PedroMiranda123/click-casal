jest.mock('../src/lib/prisma');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const prisma = require('../src/lib/prisma');

const TEST_PASSWORD = 'correct-horse-battery-staple';

async function buildTestUser() {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: await bcrypt.hash(TEST_PASSWORD, 12),
  };
}

describe('POST /auth/login', () => {
  it('succeeds with correct credentials and sets auth cookies', async () => {
    const user = await buildTestUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: user.id, name: user.name, email: user.email });

    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('fails with wrong password and does not leak whether the email exists', async () => {
    const user = await buildTestUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });
});

describe('GET /auth/me', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user when authenticated', async () => {
    const user = await buildTestUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: user.email, password: TEST_PASSWORD });

    const res = await agent.get('/auth/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: user.id, name: user.name, email: user.email });
  });
});

describe('POST /auth/logout', () => {
  it('clears the session so /auth/me becomes unauthenticated again', async () => {
    const user = await buildTestUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: user.email, password: TEST_PASSWORD });
    await agent.get('/auth/me').expect(200);

    const logoutRes = await agent.post('/auth/logout');
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get('/auth/me');
    expect(meRes.status).toBe(401);
  });
});
