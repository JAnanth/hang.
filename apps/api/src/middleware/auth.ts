import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import prisma from '../lib/prisma';

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid authorization header', statusCode: 401 });
    return;
  }

  const token = authHeader.slice(7);
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const session = await prisma.authSession.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session', statusCode: 401 });
    return;
  }

  if (session.user.deletedAt) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Account deleted', statusCode: 401 });
    return;
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  (request as FastifyRequest & { user: typeof session.user; sessionId: string }).user = session.user;
  (request as FastifyRequest & { user: typeof session.user; sessionId: string }).sessionId = session.id;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      phone: string;
      name: string;
      username: string | null;
      avatarUrl: string | null;
      berkeleyEmail: string | null;
      isVerified: boolean;
      pushToken: string | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    };
    sessionId: string;
  }
}
