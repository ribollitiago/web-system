export const USER_CONNECTION_STATE = {
  BLOCKED: 0,
  OFFLINE: 1,
  ONLINE: 2
} as const;

export type UserConnectionState =
  typeof USER_CONNECTION_STATE[keyof typeof USER_CONNECTION_STATE];
