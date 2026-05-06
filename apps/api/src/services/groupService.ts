import { randomBytes } from 'crypto';
import prisma from '../lib/prisma.js';

export function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export async function incrementMemberCount(groupId: string): Promise<void> {
  await prisma.group.update({
    where: { id: groupId },
    data: { memberCount: { increment: 1 } },
  });
}

export async function decrementMemberCount(groupId: string): Promise<void> {
  await prisma.group.update({
    where: { id: groupId },
    data: { memberCount: { decrement: 1 } },
  });
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!membership;
}

export async function isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership?.role === 'admin';
}

export async function getActiveEventCount(groupId: string): Promise<number> {
  return prisma.eventGroup.count({
    where: {
      groupId,
      event: {
        status: { in: ['active', 'confirmed'] },
        deletedAt: null,
      },
    },
  });
}
