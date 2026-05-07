import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores').optional(),
  avatarUrl: z.string().url().optional(),
  pushToken: z.string().optional(),
  berkeleyEmail: z.string().email().endsWith('.edu', 'Must be a .edu email').optional(),
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const user = request.user;
      return reply.send({
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          berkeleyEmail: user.berkeleyEmail,
          isVerified: user.isVerified,
          pushToken: user.pushToken,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
    },
  });

  app.patch('/me', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const result = updateUserSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: result.error.issues[0].message,
          statusCode: 400,
        });
      }

      const { berkeleyEmail, ...rest } = result.data;

      const updated = await prisma.user.update({
        where: { id: request.user.id },
        data: {
          ...rest,
          ...(berkeleyEmail ? { berkeleyEmail, isVerified: true } : {}),
        },
      });

      return reply.send({
        data: {
          id: updated.id,
          phone: updated.phone,
          name: updated.name,
          username: updated.username,
          avatarUrl: updated.avatarUrl,
          berkeleyEmail: updated.berkeleyEmail,
          isVerified: updated.isVerified,
          pushToken: updated.pushToken,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    },
  });

  app.get('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          isVerified: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'NotFound', message: 'User not found', statusCode: 404 });
      }

      return reply.send({ data: user });
    },
  });

  app.post('/me/connections', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { targetUserId } = request.body as { targetUserId: string };

      if (!targetUserId) {
        return reply.status(400).send({ error: 'BadRequest', message: 'targetUserId is required', statusCode: 400 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId, deletedAt: null } });
      if (!targetUser) {
        return reply.status(404).send({ error: 'NotFound', message: 'User not found', statusCode: 404 });
      }

      const [userA, userB] = [request.user.id, targetUserId].sort();

      await prisma.userConnection.upsert({
        where: { userA_userB: { userA, userB } },
        update: {},
        create: { userA, userB },
      });

      return reply.status(201).send({ data: { connected: true } });
    },
  });

  app.delete('/me/connections/:targetId', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { targetId } = request.params as { targetId: string };
      const [userA, userB] = [request.user.id, targetId].sort();

      await prisma.userConnection.deleteMany({
        where: { userA, userB },
      });

      return reply.status(204).send();
    },
  });
}
