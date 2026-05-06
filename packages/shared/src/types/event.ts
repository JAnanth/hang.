import type { PublicUser } from './user.js';

export type EventType = 'planned' | 'voting' | 'quick';
export type EventStatus = 'active' | 'confirmed' | 'cancelled' | 'ended';
export type RsvpStatus = 'going' | 'maybe' | 'cant';

export interface EventTimeOption {
  id: string;
  eventId: string;
  proposedTime: string;
  voteCount: number;
  hasVoted?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  type: EventType;
  status: EventStatus;
  createdBy: string;
  friendsOnly: boolean;
  quickAddCap: number;
  confirmedTime: string | null;
  createdAt: string;
  updatedAt: string;
  groupIds: string[];
}

export interface EventWithDetails extends Event {
  creator: PublicUser;
  groups: Array<{ id: string; name: string }>;
  rsvpCounts: { going: number; maybe: number; cant: number };
  currentUserRsvp: RsvpStatus | null;
  seenAt: string | null;
  timeOptions?: EventTimeOption[];
}

export interface RsvpEntry {
  id: string;
  eventId: string;
  userId: string;
  status: RsvpStatus;
  seenAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: PublicUser;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: PublicUser;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  type: EventType;
  groupIds: string[];
  friendsOnly?: boolean;
  confirmedTime?: string;
  timeOptions?: string[];
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  status?: EventStatus;
  confirmedTime?: string;
}

export interface FeedItem extends EventWithDetails {
  isFeatured?: boolean;
}
