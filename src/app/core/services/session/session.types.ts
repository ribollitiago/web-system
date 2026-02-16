export interface UserSession {
  id: string;
  createdAt: number;
  lastLoginAt: number;
  lastSeenAt: number;
  device?: string;
  revoked?: boolean;
}
