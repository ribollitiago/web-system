import { PermissionCriticalLevel } from './permission-level.enum';
import { PermissionConfig } from './permission.model';

export const PERMISSIONS = {
  users: {
    register: {
      id: '010001',
      critical: PermissionCriticalLevel.HIGH,
    },
    register2: {
      id: '010002',
      critical: PermissionCriticalLevel.MEDIUM,
    },
  },

  routes: {
    routes1: {
      id: '020001',
      critical: PermissionCriticalLevel.HIGH,
    },
  },

  admin: {
    admin1: {
      id: '030001',
      critical: PermissionCriticalLevel.ZERO,
    },
  },
} satisfies Record<string, Record<string, PermissionConfig>>;
