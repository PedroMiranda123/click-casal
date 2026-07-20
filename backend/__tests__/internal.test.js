'use strict';

process.env.NODE_ENV = 'test';
process.env.INTERNAL_JOB_SECRET = 'test-secret-123';

const request = require('supertest');
const express = require('express');

jest.mock('../src/services/discovery/runDiscovery', () => ({
  runDiscovery: jest.fn().mockResolvedValue({ created: 3 }),
}), { virtual: true });

const internalRouter = require('../src/routes/internal');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/internal', internalRouter);
  return app;
};

describe('POST /api/internal/run-discovery', () => {
  beforeEach(() => jest.resetAllMocks());

  test('rejects missing auth', async () => {
    const res = await request(makeApp()).post('/api/internal/run-discovery');
    expect(res.status).toBe(401);
  });

  test('rejects wrong secret', async () => {
    const res = await request(makeApp())
      .post('/api/internal/run-discovery')
      .set('Authorization', 'Bearer wrong');
    expect(res.status).toBe(401);
  });

  test('accepts correct secret and responds 200', async () => {
    const res = await request(makeApp())
      .post('/api/internal/run-discovery')
      .set('Authorization', 'Bearer test-secret-123');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
