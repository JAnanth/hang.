import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  generateInviteCode,
  incrementMemberCount,
  decrementMemberCount,
  isGroupAdmin,
  isGroupMember,
  getActiveEventCount,
} from '../services/groupService.js';

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function groupRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const memberships = await prisma.groupMember.findMany({
        where: { userId: request.user.id },
        include: {
          group: true,
        },
        orderBy: { joinedAt: 'desc' },
      });

      const groups = await Promise.all(
        memberships.map(async (m) => {
          const notifPref = await prisma.notificationPreference.findUnique({
            where: { userId_groupId: { userId: request.user.id, groupId: m.groupId } },
          });

          const activeEventCount = await getActiveEventCount(m.groupId);

          return {
            id: m.group.id,
            name: m.group.name,
            description: m.group.description,
            type: m.group.type,
            orgSlug: m.group.orgSlug,
            inviteCode: m.group.inviteCode,
            createdBy: m.group.createdBy,
            avatarUrl: m.group.avatarUrl,
            memberCount: m.group.memberCount,
            createdAt: m.group.createdAt.toISOString(),
            updatedAt: m.group.updatedAt.toISOString(),
            role: m.role,
            notificationLevel: notifPref?.level ?? 'all',
            activeEventCount,
          };
        })
      );

      return reply.send({ data: groups });
    },
  });

  app.post('/', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const result = createGroupSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'BadRequest', message: result.error.issues[0].message, statusCode: 400 });
      }

      const group = await prisma.group.create({
        data: {
          name: result.data.name,
          description: result.data.description ?? null,
          type: 'custom',
          inviteCode: generateInviteCode(),
          createdBy: request.user.id,
          memberCount: 1,
          members: {
            create: { userId: request.user.id, role: 'admin' },
          },
        },
      });

      return reply.status(201).send({
        data: {
          id: group.id,
          name: group.name,
          description: group.description,
          type: group.type,
          orgSlug: group.orgSlug,
          inviteCode: group.inviteCode,
          createdBy: group.createdBy,
          avatarUrl: group.avatarUrl,
          memberCount: group.memberCount,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
          role: 'admin',
          notificationLevel: 'all',
          activeEventCount: 0,
        },
      });
    },
  });

  app.get('/official/search', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { q } = request.query as { q?: string };

      const groups = await prisma.group.findMany({
        where: {
          type: 'official',
          deletedAt: null,
          ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        },
        take: 20,
        orderBy: { name: 'asc' },
      });

      const result = await Promise.all(
        groups.map(async (g) => {
          const isMember = await isGroupMember(g.id, request.user.id);
          return {
            id: g.id,
            name: g.name,
            description: g.description,
            type: g.type,
            orgSlug: g.orgSlug,
            inviteCode: g.inviteCode,
            avatarUrl: g.avatarUrl,
            memberCount: g.memberCount,
            isMember,
          };
        })
      );

      return reply.send({ data: result });
    },
  });

  app.get('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const isMember = await isGroupMember(id, request.user.id);
      if (!isMember) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this group', statusCode: 403 });
      }

      const group = await prisma.group.findUnique({
        where: { id, deletedAt: null },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
            },
            orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
          },
        },
      });

      if (!group) {
        return reply.status(404).send({ error: 'NotFound', message: 'Group not found', statusCode: 404 });
      }

      const membership = group.members.find((m) => m.userId === request.user.id);
      const notifPref = await prisma.notificationPreference.findUnique({
        where: { userId_groupId: { userId: request.user.id, groupId: id } },
      });
      const activeEventCount = await getActiveEventCount(id);

      return reply.send({
        data: {
          id: group.id,
          name: group.name,
          description: group.description,
          type: group.type,
          orgSlug: group.orgSlug,
          inviteCode: membership?.role === 'admin' ? group.inviteCode : undefined,
          avatarUrl: group.avatarUrl,
          memberCount: group.memberCount,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
          role: membership?.role,
          notificationLevel: notifPref?.level ?? 'all',
          activeEventCount,
          members: group.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            groupId: m.groupId,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
            user: m.user,
          })),
        },
      });
    },
  });

  app.patch('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      if (!(await isGroupAdmin(id, request.user.id))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Admin access required', statusCode: 403 });
      }

      const result = updateGroupSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'BadRequest', message: result.error.issues[0].message, statusCode: 400 });
      }

      const updated = await prisma.group.update({
        where: { id },
        data: result.data,
      });

      return reply.send({ data: updated });
    },
  });

  app.delete('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      if (!(await isGroupAdmin(id, request.user.id))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Admin access required', statusCode: 403 });
      }

      await prisma.group.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return reply.status(204).send();
    },
  });

  app.post('/:id/join', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { inviteCode } = request.body as { inviteCode: string };

      const group = await prisma.group.findUnique({ where: { id, deletedAt: null } });
      if (!group) {
        return reply.status(404).send({ error: 'NotFound', message: 'Group not found', statusCode: 404 });
      }

      if (group.inviteCode !== inviteCode) {
        return reply.status(400).send({ error: 'BadRequest', message: 'Invalid invite code', statusCode: 400 });
      }

      const existing = await isGroupMember(id, request.user.id);
      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Already a member', statusCode: 409 });
      }

      await prisma.groupMember.create({
        data: { groupId: id, userId: request.user.id, role: 'member' },
      });
      await incrementMemberCount(id);

      return reply.status(201).send({ data: { joined: true } });
    },
  });

  app.post('/:id/leave', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.groupMember.deleteMany({
        where: { groupId: id, userId: request.user.id },
      });
      await decrementMemberCount(id);

      return reply.status(204).send();
    },
  });

  app.get('/:id/members', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      if (!(await isGroupMember(id, request.user.id))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a member', statusCode: 403 });
      }

      const members = await prisma.groupMember.findMany({
        where: { groupId: id },
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
        },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      });

      return reply.send({
        data: members.map((m) => ({
          id: m.id,
          userId: m.userId,
          groupId: m.groupId,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user,
        })),
      });
    },
  });

  app.post('/:id/members', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { phone, username } = request.body as { phone?: string; username?: string };

      if (!(await isGroupMember(id, request.user.id))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a member', statusCode: 403 });
      }

      let targetUser = null;
      if (phone) {
        targetUser = await prisma.user.findUnique({ where: { phone } });
      } else if (username) {
        targetUser = await prisma.user.findUnique({ where: { username } });
      }

      if (!targetUser) {
        return reply.status(404).send({ error: 'NotFound', message: 'User not found', statusCode: 404 });
      }

      const existing = await isGroupMember(id, targetUser.id);
      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'User already a member', statusCode: 409 });
      }

      await prisma.groupMember.create({
        data: { groupId: id, userId: targetUser.id, role: 'member' },
      });
      await incrementMemberCount(id);

      return reply.status(201).send({ data: { invited: true, userId: targetUser.id } });
    },
  });

  app.delete('/:id/members/:uid', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id, uid } = request.params as { id: string; uid: string };

      if (!(await isGroupAdmin(id, request.user.id))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Admin access required', statusCode: 403 });
      }

      await prisma.groupMember.deleteMany({
        where: { groupId: id, userId: uid },
      });
      await decrementMemberCount(id);

      return reply.status(204).send();
    },
  });
}
