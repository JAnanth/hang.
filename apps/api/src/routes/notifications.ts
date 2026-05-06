import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const updatePrefSchema = z.object({
  level: z.enum(['all', 'mentions', 'off']),
});

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/preferences', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const memberships = await prisma.groupMember.findMany({
        where: { userId: request.user.id },
        include: {
          group: { select: { id: true, name: true } },
        },
      });

      const prefs = await prisma.notificationPreference.findMany({
        where: { userId: request.user.id },
      });

      const prefMap = new Map(prefs.map((p) => [p.groupId, p.level]));

      const result = memberships.map((m) => ({
        groupId: m.group.id,
        groupName: m.group.name,
        level: prefMap.get(m.group.id) ?? 'all',
      }));

      return reply.send({ data: result });
    },
  });

  app.patch('/preferences/:groupId', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { groupId } = request.params as { groupId: string };

      const result = updatePrefSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: result.error.issues[0].message,
          statusCode: 400,
        });
      }

      const pref = await prisma.notificationPreference.upsert({
        where: { userId_groupId: { userId: request.user.id, groupId } },
        update: { level: result.data.level },
        create: {
          userId: request.user.id,
          groupId,
          level: result.data.level,
        },
      });

      return reply.send({ data: { groupId: pref.groupId, level: pref.level } });
    },
  });
}
