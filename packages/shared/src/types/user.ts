export interface User {
  id: string;
  phone: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  berkeleyEmail: string | null;
  isVerified: boolean;
  pushToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Pick<User, 'id' | 'name' | 'username' | 'avatarUrl' | 'isVerified'>;

export interface UpdateUserInput {
  name?: string;
  username?: string;
  avatarUrl?: string;
  pushToken?: string;
  berkeleyEmail?: string;
}
