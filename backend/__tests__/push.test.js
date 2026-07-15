jest.mock('../src/lib/prisma');
jest.mock('../src/lib/webPush');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const prisma = require('../src/lib/prisma');
const { sendPushToUser } = require('../src/lib/webPush');

const TEST_USER_ID = 'user-1';
const PARTNER_USER_ID = 'user-2';
const TEST_PASSWORD = 'test-password';

async function loginAgent() {
  const user = {
    id: TEST_USER_ID,
    name: 'User 1',
    email: 'user1@test.com',
    passwordHash: await bcrypt.hash(TEST_PASSWORD, 12),
  };
  prisma.user.findUnique.mockResolvedValue(user);
  const agent = request.agent(app);
  await agent.post('/auth/login').send({ email: user.email, password: TEST_PASSWORD });
  return agent;
}

beforeEach(() => {
  jest.clearAllMocks();
  if (!prisma.user) prisma.user = {};
  if (!prisma.notificationLog) prisma.notificationLog = {};
  prisma.user.findMany = jest.fn().mockResolvedValue([
    { id: TEST_USER_ID },
    { id: PARTNER_USER_ID },
  ]);
  prisma.notificationLog.count = jest.fn().mockResolvedValue(0);
  prisma.notificationLog.create = jest.fn().mockResolvedValue({ id: 'notif-1' });
  sendPushToUser.mockResolvedValue([{ status: 'fulfilled' }]);
});

describe('POST /push/poke', () => {
  describe('messageId path', () => {
    it('sends a poke with valid messageId', async () => {
      const agent = await loginAgent();

      const res = await agent.post('/push/poke').send({
        messageId: 'louca',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(sendPushToUser).toHaveBeenCalledWith(
        PARTNER_USER_ID,
        expect.objectContaining({
          title: expect.stringContaining('Cutucada'),
          body: expect.stringContaining('louça'),
        })
      );
      expect(prisma.notificationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'POKE',
          pokeMessageId: 'louca',
          fromUserId: TEST_USER_ID,
          toUserId: PARTNER_USER_ID,
          title: expect.stringContaining('Cutucada'),
          body: expect.stringContaining('louça'),
        }),
      });
    });

    it('rejects invalid messageId', async () => {
      const agent = await loginAgent();

      const res = await agent.post('/push/poke').send({
        messageId: 'invalid-id',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid messageId');
    });
  });

  describe('customText path', () => {
    it('sends a poke with valid customText', async () => {
      const agent = await loginAgent();

      const res = await agent.post('/push/poke').send({
        customText: 'oi',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(sendPushToUser).toHaveBeenCalledWith(
        PARTNER_USER_ID,
        expect.objectContaining({
          title: '💬 Cutucada',
          body: 'oi',
        })
      );
      expect(prisma.notificationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'POKE',
          pokeMessageId: null,
          fromUserId: TEST_USER_ID,
          toUserId: PARTNER_USER_ID,
          title: '💬 Cutucada',
          body: 'oi',
        }),
      });
    });

    it('accepts exactly 140 characters', async () => {
      const agent = await loginAgent();
      const text = 'a'.repeat(140);

      const res = await agent.post('/push/poke').send({
        customText: text,
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('rejects more than 140 characters', async () => {
      const agent = await loginAgent();
      const text = 'a'.repeat(141);

      const res = await agent.post('/push/poke').send({
        customText: text,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Mensagem muito longa (máx 140 caracteres)');
    });

    it('rejects empty customText', async () => {
      const agent = await loginAgent();

      const res = await agent.post('/push/poke').send({
        customText: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Mensagem vazia');
    });

    it('rejects customText with only whitespace', async () => {
      const agent = await loginAgent();

      const res = await agent.post('/push/poke').send({
        customText: '   ',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Mensagem vazia');
    });
  });

  describe('validation', () => {
    it('rejects when neither messageId nor customText provided', async () => {
      const agent = await loginAgent();

      const res = await agent.post('/push/poke').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing messageId or customText');
    });

    it('rejects when both messageId and customText provided', async () => {
      const agent = await loginAgent();

      const res = await agent.post('/push/poke').send({
        messageId: 'louca',
        customText: 'oi',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Envie messageId OU customText, não os dois');
    });
  });

  describe('rate limiting', () => {
    it('enforces 5 pokes per minute limit for customText', async () => {
      const agent = await loginAgent();
      prisma.notificationLog.count.mockResolvedValue(5);

      const res = await agent.post('/push/poke').send({
        customText: 'oi',
      });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Calma aí! Máximo de 5 cutucadas por minuto.');
    });
  });
});
