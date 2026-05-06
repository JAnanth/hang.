import type { PublicUser } from './user.js';

export type GroupType = 'official' | 'custom';
export type MemberRole = 'admin' | 'member';
export type NotificationLevel = 'all' | 'mentions' | 'off';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: GroupType;
  orgSlug: string | null;
  inviteCode: string;
  createdBy: string | null;
  avatarUrl: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupWithMembership extends Group {
  role: MemberRole;
  notificationLevel: NotificationLevel;
  activeEventCount: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: PublicUser;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  type: GroupType;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
}
