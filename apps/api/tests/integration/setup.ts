import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll } from 'vitest';

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for integration tests');
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long';
process.env.TWILIO_ACCOUNT_SID = 'test-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-token';
process.env.TWILIO_VERIFY_SERVICE_SID = 'test-verify-sid';

export const prisma = new PrismaClient({
  datasources: { db: { url: testDatabaseUrl } },
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE auth_sessions, otp_sessions, rsvps, event_comments, event_time_votes, event_time_options, event_groups, events, notification_preferences, group_members, user_connections, groups, users RESTART IDENTITY CASCADE`;
  await prisma.$disconnect();
});
