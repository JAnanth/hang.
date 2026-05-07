import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { createEvent, formatEventWithDetails } from '../services/eventService';
import { notifyNewRsvp, notifyTimeConfirmed } from '../services/pushService';
import { scheduleEventReminder, cancelEventReminder } from '../jobs/reminderJob';
import { isGroupMember } from '../services/groupService';

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  type: z.enum(['planned', 'voting', 'quick']),
  groupIds: z.array(z.string().uuid()).min(1),
  friendsOnly: z.boolean().optional(),
  confirmedTime: z.string().datetime().optional(),
  timeOptions: z.array(z.string().datetime()).min(2).max(4).optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  status: z.enum(['active', 'confirmed', 'cancelled', 'ended']).optional(),
  confirmedTime: z.string().datetime().optional(),
});

export async function eventRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { groupId, page = '1', pageSize = '20' } = request.query as {
        groupId?: string;
        page?: string;
        pageSize?: string;
      };

      const pageNum = Math.max(1, parseInt(page));
      const size = Math.min(50, Math.max(1, parseInt(pageSize)));
      const skip = (pageNum - 1) * size;

      const userGroups = await prisma.groupMember.findMany({
        where: { userId: request.user.id },
        select: { groupId: true },
      });

      const groupIds = userGroups.map((g) => g.groupId);
      const filteredGroupIds = groupId ? [groupId] : groupIds;

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where: {
            deletedAt: null,
            status: { not: 'cancelled' },
            eventGroups: {
              some: { groupId: { in: filteredGroupIds } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: size,
        }),
        prisma.event.count({
          where: {
            deletedAt: null,
            status: { not: 'cancelled' },
            eventGroups: {
              some: { groupId: { in: filteredGroupIds } },
            },
          },
        }),
      ]);

      const detailedEvents = await Promise.all(
        events.map((e) => formatEventWithDetails(e.id, request.user.id))
      );

      return reply.send({
        data: detailedEvents.filter(Boolean),
        total,
        page: pageNum,
        pageSize: size,
        hasMore: skip + size < total,
      });
    },
  });

  app.post('/', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const result = createEventSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: result.error.issues[0].message,
          statusCode: 400,
        });
      }

      for (const groupId of result.data.groupIds) {
        if (!(await isGroupMember(groupId, request.user.id))) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: `Not a member of group ${groupId}`,
            statusCode: 403,
          });
        }
      }

      const event = await createEvent(result.data, request.user.id);
      return reply.status(201).send({ data: event });
    },
  });

  app.get('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const event = await formatEventWithDetails(id, request.user.id);
      if (!event) {
        return reply.status(404).send({ error: 'NotFound', message: 'Event not found', statusCode: 404 });
      }

      const isMemberOfAny = await Promise.any(
        event.groupIds.map((gid) => isGroupMember(gid, request.user.id).then((m) => { if (!m) throw new Error(); }))
      ).catch(() => false).then(() => true);

      if (!isMemberOfAny) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this event\'s group', statusCode: 403 });
      }

      await prisma.rsvp.upsert({
        where: { eventId_userId: { eventId: id, userId: request.user.id } },
        update: { seenAt: new Date() },
        create: {
          eventId: id,
          userId: request.user.id,
          status: 'maybe',
          seenAt: new Date(),
        },
      });

      return reply.send({ data: event });
    },
  });

  app.patch('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const event = await prisma.event.findUnique({ where: { id, deletedAt: null } });
      if (!event) {
        return reply.status(404).send({ error: 'NotFound', message: 'Event not found', statusCode: 404 });
      }

      if (event.createdBy !== request.user.id) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the creator can update this event', statusCode: 403 });
      }

      const result = updateEventSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'BadRequest', message: result.error.issues[0].message, statusCode: 400 });
      }

      const { confirmedTime, ...rest } = result.data;

      const updated = await prisma.event.update({
        where: { id },
        data: {
          ...rest,
          ...(confirmedTime ? { confirmedTime: new Date(confirmedTime) } : {}),
        },
      });

      if (confirmedTime) {
        await cancelEventReminder(id).catch(() => null);
        await scheduleEventReminder(id, new Date(confirmedTime));
      }

      const formatted = await formatEventWithDetails(id, request.user.id);
      return reply.send({ data: formatted });
    },
  });

  app.delete('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const event = await prisma.event.findUnique({ where: { id, deletedAt: null } });
      if (!event) {
        return reply.status(404).send({ error: 'NotFound', message: 'Event not found', statusCode: 404 });
      }

      if (event.createdBy !== request.user.id) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the creator can cancel this event', statusCode: 403 });
      }

      await prisma.event.update({
        where: { id },
        data: { status: 'cancelled', deletedAt: new Date() },
      });

      await cancelEventReminder(id).catch(() => null);

      return reply.status(204).send();
    },
  });

  app.post('/:id/rsvp', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      if (!['going', 'maybe', 'cant'].includes(status)) {
        return reply.status(400).send({ error: 'BadRequest', message: 'status must be going, maybe, or cant', statusCode: 400 });
      }

      const event = await prisma.event.findUnique({
        where: { id, deletedAt: null },
        include: { eventGroups: true },
      });

      if (!event) {
        return reply.status(404).send({ error: 'NotFound', message: 'Event not found', statusCode: 404 });
      }

      const existingRsvp = await prisma.rsvp.findUnique({
        where: { eventId_userId: { eventId: id, userId: request.user.id } },
      });

      const rsvp = await prisma.rsvp.upsert({
        where: { eventId_userId: { eventId: id, userId: request.user.id } },
        update: { status, updatedAt: new Date() },
        create: {
          eventId: id,
          userId: request.user.id,
          status,
          seenAt: new Date(),
        },
      });

      if (!existingRsvp || existingRsvp.status !== status) {
        const goingCount = await prisma.rsvp.count({
          where: { eventId: id, status: 'going' },
        });

        await notifyNewRsvp({
          eventId: id,
          eventTitle: event.title,
          creatorId: event.createdBy,
          rsvperName: request.user.name,
          rsvpCount: goingCount,
        }).catch((err) => console.error('Notification error:', err));
      }

      return reply.send({
        data: {
          id: rsvp.id,
          eventId: rsvp.eventId,
          userId: rsvp.userId,
          status: rsvp.status,
          seenAt: rsvp.seenAt?.toISOString() ?? null,
          createdAt: rsvp.createdAt.toISOString(),
          updatedAt: rsvp.updatedAt.toISOString(),
        },
      });
    },
  });

  app.patch('/:id/rsvp', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      return reply.status(308).send({ location: `/api/v1/events/${(request.params as { id: string }).id}/rsvp` });
    },
  });

  app.post('/:id/seen', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.rsvp.upsert({
        where: { eventId_userId: { eventId: id, userId: request.user.id } },
        update: { seenAt: new Date() },
        create: {
          eventId: id,
          userId: request.user.id,
          status: 'maybe',
          seenAt: new Date(),
        },
      });

      return reply.status(204).send();
    },
  });

  app.get('/:id/rsvps', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const rsvps = await prisma.rsvp.findMany({
        where: { eventId: id },
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      });

      return reply.send({
        data: rsvps.map((r) => ({
          id: r.id,
          eventId: r.eventId,
          userId: r.userId,
          status: r.status,
          seenAt: r.seenAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          user: r.user,
        })),
      });
    },
  });

  app.post('/:id/comments', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { body } = request.body as { body: string };

      if (!body || body.trim().length === 0) {
        return reply.status(400).send({ error: 'BadRequest', message: 'Comment body is required', statusCode: 400 });
      }

      if (body.length > 280) {
        return reply.status(400).send({ error: 'BadRequest', message: 'Comment must be 280 characters or less', statusCode: 400 });
      }

      const comment = await prisma.eventComment.create({
        data: {
          eventId: id,
          userId: request.user.id,
          body: body.trim(),
        },
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
        },
      });

      return reply.status(201).send({
        data: {
          id: comment.id,
          eventId: comment.eventId,
          userId: comment.userId,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          user: comment.user,
        },
      });
    },
  });

  app.get('/:id/comments', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { page = '1', pageSize = '20' } = request.query as { page?: string; pageSize?: string };

      const pageNum = Math.max(1, parseInt(page));
      const size = Math.min(100, parseInt(pageSize));
      const skip = (pageNum - 1) * size;

      const [comments, total] = await Promise.all([
        prisma.eventComment.findMany({
          where: { eventId: id, deletedAt: null },
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: size,
        }),
        prisma.eventComment.count({ where: { eventId: id, deletedAt: null } }),
      ]);

      return reply.send({
        data: comments.map((c) => ({
          id: c.id,
          eventId: c.eventId,
          userId: c.userId,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          user: c.user,
        })),
        total,
        page: pageNum,
        pageSize: size,
        hasMore: skip + size < total,
      });
    },
  });

  app.delete('/:id/comments/:cid', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id, cid } = request.params as { id: string; cid: string };

      const comment = await prisma.eventComment.findUnique({ where: { id: cid } });
      if (!comment) {
        return reply.status(404).send({ error: 'NotFound', message: 'Comment not found', statusCode: 404 });
      }

      if (comment.userId !== request.user.id) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Cannot delete another user\'s comment', statusCode: 403 });
      }

      await prisma.eventComment.update({ where: { id: cid }, data: { deletedAt: new Date() } });
      return reply.status(204).send();
    },
  });

  app.post('/:id/vote', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { timeOptionId } = request.body as { timeOptionId: string };

      const option = await prisma.eventTimeOption.findUnique({
        where: { id: timeOptionId },
      });

      if (!option || option.eventId !== id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Time option not found', statusCode: 404 });
      }

      await prisma.eventTimeVote.upsert({
        where: { timeOptionId_userId: { timeOptionId, userId: request.user.id } },
        update: {},
        create: { timeOptionId, userId: request.user.id },
      });

      await prisma.eventTimeOption.update({
        where: { id: timeOptionId },
        data: {
          voteCount: await prisma.eventTimeVote.count({ where: { timeOptionId } }),
        },
      });

      return reply.status(204).send();
    },
  });

  app.post('/:id/confirm', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { timeOptionId } = request.body as { timeOptionId: string };

      const event = await prisma.event.findUnique({
        where: { id, deletedAt: null },
        include: { eventGroups: { include: { group: { select: { name: true } } } } },
      });

      if (!event) {
        return reply.status(404).send({ error: 'NotFound', message: 'Event not found', statusCode: 404 });
      }

      if (event.createdBy !== request.user.id) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the creator can confirm a time', statusCode: 403 });
      }

      const option = await prisma.eventTimeOption.findUnique({ where: { id: timeOptionId } });
      if (!option || option.eventId !== id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Time option not found', statusCode: 404 });
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          confirmedTime: option.proposedTime,
          status: 'confirmed',
          type: 'planned',
        },
      });

      await scheduleEventReminder(id, option.proposedTime);

      const groupName = event.eventGroups[0]?.group.name ?? 'group';
      await notifyTimeConfirmed({
        eventId: id,
        eventTitle: event.title,
        groupName,
        confirmedTime: option.proposedTime,
      }).catch((err) => console.error('Notification error:', err));

      const formatted = await formatEventWithDetails(id, request.user.id);
      return reply.send({ data: formatted });
    },
  });
}
