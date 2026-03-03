import { PermissionCriticalLevel } from './permission-level.enum';
import { PermissionConfig } from './permission.model';

export const PERMISSIONS = {
  users: {
    register: { id: '010001', critical: PermissionCriticalLevel.HIGH },
    register2: { id: '010002', critical: PermissionCriticalLevel.MEDIUM },
    register3: { id: '010003', critical: PermissionCriticalLevel.LOW },
    register4: { id: '010004', critical: PermissionCriticalLevel.ZERO },
    register5: { id: '010005', critical: PermissionCriticalLevel.HIGH },
    register6: { id: '010006', critical: PermissionCriticalLevel.LOW },
    register7: { id: '010007', critical: PermissionCriticalLevel.MEDIUM },
    register8: { id: '010008', critical: PermissionCriticalLevel.ZERO },
    register9: { id: '010009', critical: PermissionCriticalLevel.HIGH },
    register10: { id: '010010', critical: PermissionCriticalLevel.MEDIUM },
    register11: { id: '010011', critical: PermissionCriticalLevel.LOW },
    register12: { id: '010012', critical: PermissionCriticalLevel.ZERO },
  },

  routes: {
    routes1: { id: '020001', critical: PermissionCriticalLevel.HIGH },
    routes2: { id: '020002', critical: PermissionCriticalLevel.LOW },
    routes3: { id: '020003', critical: PermissionCriticalLevel.MEDIUM },
    routes4: { id: '020004', critical: PermissionCriticalLevel.ZERO },
    routes5: { id: '020005', critical: PermissionCriticalLevel.HIGH },
    routes6: { id: '020006', critical: PermissionCriticalLevel.LOW },
    routes7: { id: '020007', critical: PermissionCriticalLevel.MEDIUM },
    routes8: { id: '020008', critical: PermissionCriticalLevel.ZERO },
    routes9: { id: '020009', critical: PermissionCriticalLevel.HIGH },
    routes10: { id: '020010', critical: PermissionCriticalLevel.MEDIUM },
    routes11: { id: '020011', critical: PermissionCriticalLevel.LOW },
    routes12: { id: '020012', critical: PermissionCriticalLevel.ZERO },
  },

  admin: {
    admin1: { id: '030001', critical: PermissionCriticalLevel.ZERO },
    admin2: { id: '030002', critical: PermissionCriticalLevel.MEDIUM },
    admin3: { id: '030003', critical: PermissionCriticalLevel.HIGH },
    admin4: { id: '030004', critical: PermissionCriticalLevel.LOW },
    admin5: { id: '030005', critical: PermissionCriticalLevel.HIGH },
    admin6: { id: '030006', critical: PermissionCriticalLevel.LOW },
    admin7: { id: '030007', critical: PermissionCriticalLevel.MEDIUM },
    admin8: { id: '030008', critical: PermissionCriticalLevel.ZERO },
    admin9: { id: '030009', critical: PermissionCriticalLevel.HIGH },
    admin10: { id: '030010', critical: PermissionCriticalLevel.MEDIUM },
    admin11: { id: '030011', critical: PermissionCriticalLevel.LOW },
    admin12: { id: '030012', critical: PermissionCriticalLevel.ZERO },
  },
} satisfies Record<string, Record<string, PermissionConfig>>;
