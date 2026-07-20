'use strict';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.INTERNAL_JOB_SECRET = 'test-job-secret';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    userInterest: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock auth middleware
jest.mock('../src/middleware/authenticate', () => (req, res, next) => {
  req.user = { id: 'user-pedro', email: 'pedro@test.com' };
  next();
}, { virtual: true });

const interestsRouter = require('../src/routes/interests');

const makeApp = () => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/interests', interestsRouter);
  return app;
};

describe('GET /api/interests', () => {
  beforeEach(() => jest.resetAllMocks());

  test('returns interests for current user', async () => {
    prisma.userInterest.findMany.mockResolvedValueOnce([
      { id: '1', label: 'jazz', userId: 'user-pedro', createdAt: new Date() },
    ]);

    const res = await request(makeApp()).get('/api/interests');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].label).toBe('jazz');
  });
});

describe('POST /api/interests', () => {
  beforeEach(() => jest.resetAllMocks());

  test('rejects empty label', async () => {
    const res = await request(makeApp()).post('/api/interests').send({ label: '' });
    expect(res.status).toBe(400);
  });

  test('creates interest', async () => {
    prisma.userInterest.upsert.mockResolvedValueOnce({ id: '2', label: 'cinema', userId: 'user-pedro' });
    const res = await request(makeApp()).post('/api/interests').send({ label: 'cinema' });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe('cinema');
  });
});

describe('DELETE /api/interests/:id', () => {
  beforeEach(() => jest.resetAllMocks());

  test('rejects deleting another user\'s interest', async () => {
    prisma.userInterest.findUnique.mockResolvedValueOnce({ id: '3', userId: 'user-ana' });
    const res = await request(makeApp()).delete('/api/interests/3');
    expect(res.status).toBe(403);
  });

  test('deletes own interest', async () => {
    prisma.userInterest.findUnique.mockResolvedValueOnce({ id: '4', userId: 'user-pedro' });
    prisma.userInterest.delete.mockResolvedValueOnce({});
    const res = await request(makeApp()).delete('/api/interests/4');
    expect(res.status).toBe(200);
  });
});
