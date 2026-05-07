import prisma from '../lib/prisma';
import { scheduleEventReminder } from '../jobs/reminderJob';
import { notifyNewEvent } from './pushService';
import type { CreateEventInput, EventWithDetails } from '@hang/shared';

export async function formatEventWithDetails(
  eventId: string,
  viewerId?: string
): Promise<EventWithDetails | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      creator: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
      eventGroups: { include: { group: { select: { id: true, name: true } } } },
      rsvps: {
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true } },
        },
      },
      timeOptions: {
        include: {
          votes: viewerId
            ? { where: { userId: viewerId }, select: { id: true } }
            : false,
        },
        orderBy: { proposedTime: 'asc' },
      },
    },
  });

  if (!event) return null;

  const viewerRsvp = viewerId ? event.rsvps.find((r) => r.userId === viewerId) : undefined;
  const rsvpCounts = {
    going: event.rsvps.filter((r) => r.status === 'going').length,
    maybe: event.rsvps.filter((r) => r.status === 'maybe').length,
    cant: event.rsvps.filter((r) => r.status === 'cant').length,
  };

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    type: event.type as EventWithDetails['type'],
    status: event.status as EventWithDetails['status'],
    createdBy: event.createdBy,
    friendsOnly: event.friendsOnly,
    quickAddCap: event.quickAddCap,
    confirmedTime: event.confirmedTime?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    groupIds: event.eventGroups.map((eg) => eg.groupId),
    creator: event.creator,
    groups: event.eventGroups.map((eg) => ({ id: eg.group.id, name: eg.group.name })),
    rsvpCounts,
    currentUserRsvp: (viewerRsvp?.status as EventWithDetails['currentUserRsvp']) ?? null,
    seenAt: viewerRsvp?.seenAt?.toISOString() ?? null,
    timeOptions: event.timeOptions.map((opt) => ({
      id: opt.id,
      eventId: opt.eventId,
      proposedTime: opt.proposedTime.toISOString(),
      voteCount: opt.voteCount,
      hasVoted: viewerId ? (opt.votes as { id: string }[]).length > 0 : undefined,
    })),
  };
}

export async function createEvent(
  input: CreateEventInput,
  creatorId: string
): Promise<EventWithDetails> {
  const event = await prisma.event.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      type: input.type,
      status: 'active',
      createdBy: creatorId,
      friendsOnly: input.friendsOnly ?? false,
      confirmedTime: input.confirmedTime ? new Date(input.confirmedTime) : null,
      eventGroups: {
        create: input.groupIds.map((groupId) => ({ groupId })),
      },
      timeOptions: input.timeOptions?.length
        ? {
            create: input.timeOptions.map((time) => ({ proposedTime: new Date(time) })),
          }
        : undefined,
    },
  });

  if (event.confirmedTime) {
    await scheduleEventReminder(event.id, event.confirmedTime);
  }

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { name: true },
  });

  for (const groupId of input.groupIds) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    });

    if (group && creator) {
      await notifyNewEvent({
        eventId: event.id,
        eventTitle: event.title,
        groupId,
        groupName: group.name,
        creatorName: creator.name,
        excludeUserId: creatorId,
      }).catch((err) => console.error('Notification error:', err));
    }
  }

  const formatted = await formatEventWithDetails(event.id, creatorId);
  return formatted!;
}
