import { USER_CONNECTION_STATE } from '../services/session/connection-state.enum';
import { UserSession } from '../services/session/session.types';

const ONLINE_TIMEOUT = 30 * 60 * 1000;

export function resolveConnectionState(
  session?: UserSession | null,
  blocked?: boolean
) {

  if (blocked) {
    return USER_CONNECTION_STATE.BLOCKED;
  }

  if (!session) {
    return USER_CONNECTION_STATE.OFFLINE;
  }

  if (session.revoked) {
    return USER_CONNECTION_STATE.OFFLINE;
  }

  if (!session.lastSeenAt) {
    return USER_CONNECTION_STATE.OFFLINE;
  }

  const diff = Date.now() - session.lastSeenAt;

  if (diff <= ONLINE_TIMEOUT) {
    return USER_CONNECTION_STATE.ONLINE;
  }

  return USER_CONNECTION_STATE.OFFLINE;
}
