import prisma from '../lib/prisma.js';
import { sendPushNotification } from '../lib/apns.js';

export async function notifyNewEvent(params: {
  eventId: string;
  eventTitle: string;
  groupId: string;
  groupName: string;
  creatorName: string;
  excludeUserId: string;
}): Promise<void> {
  const members = await prisma.groupMember.findMany({
    where: {
      groupId: params.groupId,
      userId: { not: params.excludeUserId },
    },
    include: {
      user: {
        select: { id: true, pushToken: true },
      },
    },
  });

  const prefs = await prisma.notificationPreference.findMany({
    where: {
      groupId: params.groupId,
      userId: { in: members.map((m) => m.userId) },
    },
  });

  const prefMap = new Map(prefs.map((p) => [p.userId, p.level]));

  const promises = members
    .filter((m) => {
      const level = prefMap.get(m.userId) ?? 'all';
      return level !== 'off' && m.user.pushToken;
    })
    .map((m) =>
      sendPushNotification({
        deviceToken: m.user.pushToken!,
        title: 'hang.',
        body: `${params.creatorName} posted an event in ${params.groupName}`,
        data: {
          type: 'NEW_EVENT',
          eventId: params.eventId,
          groupId: params.groupId,
        },
        badge: 1,
      }).catch((err) => console.error('Push send error:', err))
    );

  await Promise.allSettled(promises);
}

export async function notifyNewRsvp(params: {
  eventId: string;
  eventTitle: string;
  creatorId: string;
  rsvperName: string;
  rsvpCount: number;
}): Promise<void> {
  const creator = await prisma.user.findUnique({
    where: { id: params.creatorId },
    select: { pushToken: true },
  });

  if (!creator?.pushToken) return;

  const shouldSend = params.rsvpCount === 1 || params.rsvpCount % 3 === 0;
  if (!shouldSend) return;

  const body =
    params.rsvpCount === 1
      ? `${params.rsvperName} is going to ${params.eventTitle}`
      : `${params.rsvperName} and ${params.rsvpCount - 1} others are going to ${params.eventTitle}`;

  await sendPushNotification({
    deviceToken: creator.pushToken,
    title: 'hang.',
    body,
    data: {
      type: 'NEW_RSVP',
      eventId: params.eventId,
    },
  }).catch((err) => console.error('Push send error:', err));
}

export async function notifyTimeConfirmed(params: {
  eventId: string;
  eventTitle: string;
  groupName: string;
  confirmedTime: Date;
}): Promise<void> {
  const rsvps = await prisma.rsvp.findMany({
    where: {
      eventId: params.eventId,
      status: { in: ['going', 'maybe'] },
    },
    include: {
      user: { select: { pushToken: true } },
    },
  });

  const formattedTime = params.confirmedTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const promises = rsvps
    .filter((r) => r.user.pushToken)
    .map((r) =>
      sendPushNotification({
        deviceToken: r.user.pushToken!,
        title: params.groupName,
        body: `Time confirmed for ${params.eventTitle}: ${formattedTime}`,
        data: {
          type: 'TIME_CONFIRMED',
          eventId: params.eventId,
        },
      }).catch((err) => console.error('Push send error:', err))
    );

  await Promise.allSettled(promises);
}

export async function sendEventReminder(eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventGroups: { include: { group: { select: { name: true } } } },
    },
  });

  if (!event || event.status === 'cancelled') return;

  const rsvps = await prisma.rsvp.findMany({
    where: {
      eventId,
      status: { in: ['going', 'maybe'] },
    },
    include: {
      user: { select: { id: true, pushToken: true } },
    },
  });

  const groupIds = event.eventGroups.map((eg) => eg.groupId);

  const promises = rsvps
    .filter((r) => r.user.pushToken)
    .map(async (r) => {
      const pref = await prisma.notificationPreference.findFirst({
        where: { userId: r.user.id, groupId: { in: groupIds } },
      });

      if (pref?.level === 'off') return;

      return sendPushNotification({
        deviceToken: r.user.pushToken!,
        title: 'Heads up!',
        body: `${event.title} starts in 1 hour`,
        data: {
          type: 'REMINDER',
          eventId,
        },
      }).catch((err) => console.error('Push send error:', err));
    });

  await Promise.allSettled(promises);
}
