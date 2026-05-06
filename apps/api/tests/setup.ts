import { vi } from 'vitest';

vi.mock('../src/lib/redis.js', () => ({
  getRedis: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
  })),
  default: vi.fn(),
}));

vi.mock('../src/lib/apns.js', () => ({
  getApnsProvider: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ sent: [], failed: [] }),
  })),
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/jobs/reminderJob.js', () => ({
  scheduleEventReminder: vi.fn().mockResolvedValue(undefined),
  cancelEventReminder: vi.fn().mockResolvedValue(undefined),
  getReminderQueue: vi.fn(),
  startReminderWorker: vi.fn(),
}));
