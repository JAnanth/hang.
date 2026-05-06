export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SendOtpInput {
  phone: string;
}

export interface VerifyOtpInput {
  phone: string;
  code: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: import('./user.js').User;
  isNewUser: boolean;
}

export interface JoinGroupInput {
  inviteCode: string;
}

export interface NotificationPreference {
  groupId: string;
  groupName: string;
  level: import('./group.js').NotificationLevel;
}

export type PushNotificationType = 'NEW_EVENT' | 'NEW_RSVP' | 'REMINDER' | 'TIME_CONFIRMED';

export interface PushPayload {
  type: PushNotificationType;
  eventId?: string;
  groupId?: string;
}
