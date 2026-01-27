import { PermissionCriticalLevel } from './permission-level.enum';

export interface PermissionConfig {
  id: string;
  critical: PermissionCriticalLevel;
}
