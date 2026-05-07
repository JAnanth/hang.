import { describe, it, expect, beforeAll, vi } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/server';
import type { FastifyInstance } from 'fastify';

vi.mock('../../src/services/otpService.js', () => ({
  sendOtp: vi.fn().mockResolvedValue(undefined),
  verifyOtp: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/lib/redis.js', () => ({
  getRedis: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    call: vi.fn(),
  })),
}));

vi.mock('../../src/middleware/rateLimit.js', () => ({
  registerRateLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/jobs/reminderJob.js', () => ({
  scheduleEventReminder: vi.fn().mockResolvedValue(undefined),
  cancelEventReminder: vi.fn().mockResolvedValue(undefined),
  startReminderWorker: vi.fn(),
}));

let app: FastifyInstance;
const testPhone = '+14155550001';

describe('Auth API', () => {
  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  it('POST /api/v1/auth/otp/send — returns 200', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/auth/otp/send')
      .send({ phone: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(true);
  });

  it('POST /api/v1/auth/otp/send — rejects invalid phone', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/auth/otp/send')
      .send({ phone: '555-1234' });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/auth/otp/verify — creates new user and returns token', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: testPhone, code: '123456', name: 'Test User' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.isNewUser).toBe(true);
    expect(res.body.data.user.name).toBe('Test User');
  });

  it('POST /api/v1/auth/otp/verify — returns existing user on second call', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: testPhone, code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.isNewUser).toBe(false);
  });

  it('GET /api/v1/users/me — returns 401 without token', async () => {
    const res = await supertest(app.server).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('Full auth flow: send → verify → get /me', async () => {
    const phone = '+14155550099';
    await supertest(app.server).post('/api/v1/auth/otp/send').send({ phone });

    const verifyRes = await supertest(app.server)
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: '123456', name: 'Flow User' });

    const token = verifyRes.body.data.token;

    const meRes = await supertest(app.server)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.name).toBe('Flow User');
    expect(meRes.body.data.phone).toBe(phone);
  });
});
