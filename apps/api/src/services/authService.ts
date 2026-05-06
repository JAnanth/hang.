import { randomBytes, createHash } from 'crypto';
import prisma from '../lib/prisma.js';

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export function generateSessionToken(): string {
  return randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string, deviceInfo?: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      deviceInfo: deviceInfo ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return token;
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.authSession.delete({ where: { id: sessionId } });
}

export async function refreshSession(sessionId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);

  await prisma.authSession.update({
    where: { id: sessionId },
    data: {
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      lastUsedAt: new Date(),
    },
  });

  return token;
}
