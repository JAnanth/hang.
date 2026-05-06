import { describe, it, expect, beforeAll, vi } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/server.js';
import { prisma } from './setup.js';
import { createSession } from '../../src/services/authService.js';
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

vi.mock('../../src/lib/apns.js', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}));

let app: FastifyInstance;
let token: string;
let groupId: string;
let userId: string;

describe('Events API', () => {
  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const user = await prisma.user.create({
      data: { phone: '+14155550002', name: 'Event Test User' },
    });
    userId = user.id;
    token = await createSession(userId);

    const group = await prisma.group.create({
      data: {
        name: 'Test Group',
        type: 'custom',
        inviteCode: 'TESTCODE1',
        createdBy: userId,
        memberCount: 1,
        members: { create: { userId, role: 'admin' } },
      },
    });
    groupId = group.id;
  });

  it('POST /api/v1/events — creates a planned event', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pickup basketball at RSF',
        location: 'RSF Courts',
        type: 'planned',
        groupIds: [groupId],
        confirmedTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Pickup basketball at RSF');
    expect(res.body.data.type).toBe('planned');
    expect(res.body.data.creator.id).toBe(userId);
  });

  it('POST /api/v1/events — creates a quick event', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Chilling in the common room',
        type: 'quick',
        groupIds: [groupId],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('quick');
  });

  it('POST /api/v1/events — creates a voting event with time options', async () => {
    const now = Date.now();
    const res = await supertest(app.server)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Study session',
        type: 'voting',
        groupIds: [groupId],
        timeOptions: [
          new Date(now + 3600 * 1000).toISOString(),
          new Date(now + 7200 * 1000).toISOString(),
          new Date(now + 10800 * 1000).toISOString(),
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.timeOptions).toHaveLength(3);
  });

  it('GET /api/v1/events — returns feed for user groups', async () => {
    const res = await supertest(app.server)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('RSVP flow: POST /rsvp then check rsvps list', async () => {
    const createRes = await supertest(app.server)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'RSVP Test Event', type: 'quick', groupIds: [groupId] });

    const eventId = createRes.body.data.id;

    const rsvpRes = await supertest(app.server)
      .post(`/api/v1/events/${eventId}/rsvp`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'going' });

    expect(rsvpRes.status).toBe(200);
    expect(rsvpRes.body.data.status).toBe('going');

    const listRes = await supertest(app.server)
      .get(`/api/v1/events/${eventId}/rsvps`)
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    const goingEntry = listRes.body.data.find((r: { status: string }) => r.status === 'going');
    expect(goingEntry).toBeTruthy();
  });
});
