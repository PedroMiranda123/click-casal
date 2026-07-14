const request = require('supertest');
const app = require('../index');

describe('GET /', () => {
  it('responds with the hello world message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello from Dokploy!');
  });
});
