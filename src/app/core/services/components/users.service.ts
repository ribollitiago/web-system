import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { Group, GroupsService } from './groups.service';
import { RealtimeService } from '../database/realtime.service';
import { formatDateShortBR } from '../../utils/date.utils';

export interface Session {
  isOnline?: boolean;
  blocked?: boolean;
  lastLogin?: string | null;
  lastSeen?: string | null;
  device?: string | null;
}

export interface meta {
    blocked: boolean;
    invisible: boolean;
    invisibleAt: string | null;
}

export interface User {
  uid: string;
  enrollment: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  permissions: string[];
  groupPermissions: string[];
  groups: Group[];
  session?: Session;
  createdAt?: string | null;
  meta?: meta;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  private users: User[] = [];
  private realtimeSubscribed = false;
  private sessionByUid = new Map<string, Session>();

  private readonly handleUsersChanged = () => {
    this.refreshUsers();
  };

  private readonly handlePresenceChanged = (payload: any) => {
    const userUid = payload?.userUid;
    if (!userUid || typeof userUid !== 'string') return;

    const currentSession = this.sessionByUid.get(userUid) ?? {};
    this.sessionByUid.set(userUid, {
      ...currentSession,
      isOnline: !!payload.online,
      lastSeen: this.normalizeDate(payload.lastSeen) ?? currentSession.lastSeen ?? null,
    });

    this.users = this.users.map((user) => {
      if (user.uid !== userUid) return user;
      return {
        ...user,
        session: {
          ...user.session,
          ...this.sessionByUid.get(userUid),
        },
      };
    });

    this.usersSubject.next(this.users);
  };

  private readonly handlePermissionsUpdated = (payload: any) => {
    const userUid = payload?.userUid;
    if (!userUid) return;
    this.refreshUsers();
  };

  constructor(
    private databaseService: DatabaseService,
    private groupsService: GroupsService,
    private realtimeService: RealtimeService,
  ) { }

  async subscribe(): Promise<void> {
    await this.refreshUsers();
    this.attachRealtime();
  }

  unSubscribe(): void {
    if (!this.realtimeSubscribed) return;

    this.realtimeService.off('user_created', this.handleUsersChanged);
    this.realtimeService.off('user_updated', this.handleUsersChanged);
    this.realtimeService.off('presence_changed', this.handlePresenceChanged);
    this.realtimeService.off('permissions_updated', this.handlePermissionsUpdated);
    this.realtimeSubscribed = false;
  }

  async getUsersOnce(): Promise<User[]> {
    const [rawUsersResponse, groupsResponse] = await Promise.all([
      this.databaseService.getList('users') as Promise<any[]>,
      this.groupsService.getGroupsOnce(),
    ]);

    const rawUsers = this.asArray<any>(rawUsersResponse);
    const groups = this.asArray<Group>(groupsResponse);
    return this.mapUsers(rawUsers, groups);
  }

  getUsers(): readonly User[] {
    return this.users;
  }

  private async refreshUsers() {
    const [rawUsersResponse, groupsResponse] = await Promise.all([
      this.databaseService.getList('users') as Promise<any[]>,
      this.groupsService.getGroupsOnce(),
    ]);

    const rawUsers = this.asArray<any>(rawUsersResponse);
    const groups = this.asArray<Group>(groupsResponse);

    this.users = this.mapUsers(rawUsers, groups);
    this.usersSubject.next(this.users);
  }

  private attachRealtime() {
    if (this.realtimeSubscribed) return;

    this.realtimeService.on('user_created', this.handleUsersChanged);
    this.realtimeService.on('user_updated', this.handleUsersChanged);
    this.realtimeService.on('presence_changed', this.handlePresenceChanged);
    this.realtimeService.on('permissions_updated', this.handlePermissionsUpdated);
    this.realtimeSubscribed = true;
  }

  private mapUsers(rawUsers: any[], groups: Group[]): User[] {
    return rawUsers.map((rawUser) => {
      const userGroups = this.resolveGroups(
        rawUser.groups,
        Array.isArray(rawUser.groupEnrollments) ? rawUser.groupEnrollments : [],
        groups,
      );

      const directPermissionCodes = Array.isArray(rawUser.permissions)
        ? rawUser.permissions
          .filter((value: unknown): value is string => typeof value === 'string')
        : [];

      const groupPermissionCodes = Array.isArray(rawUser.groupPermissions)
        ? rawUser.groupPermissions
          .filter((value: unknown): value is string => typeof value === 'string')
        : [];

      const uid = String(rawUser.uid ?? '');
      const liveSession = this.sessionByUid.get(uid);
      const rawSession = rawUser?.session ?? {};
      const rawMeta = rawUser?.meta ?? {};

      const session: Session = {
        blocked: this.parseBoolean(rawSession.blocked ?? rawMeta.blocked, false),
        isOnline: this.parseBoolean(rawSession.isOnline, liveSession?.isOnline ?? false),
        device:
          rawSession.device ??
          liveSession?.device ??
          null,
        lastLogin:
          this.normalizeDate(rawSession.lastLogin) ??
          liveSession?.lastLogin ??
          null,
        lastSeen:
          this.normalizeDate(rawSession.lastSeen) ??
          liveSession?.lastSeen ??
          null,
      };

      this.sessionByUid.set(uid, session);

      return {
        uid,
        enrollment: String(rawUser.enrollment ?? ''),
        name: rawUser.name || '',
        email: rawUser.email || '',
        date: rawUser.date || '',
        phone: rawUser.phone || '',
        description: rawUser.description || '',
        permissions: Array.from(new Set(directPermissionCodes)),
        groupPermissions: Array.from(new Set(groupPermissionCodes)),
        groups: userGroups,
        session,
        createdAt: this.normalizeDate(rawUser.createdAt),
        meta: {
          blocked: this.parseBoolean(rawMeta.blocked, false),
          invisible: this.parseBoolean(rawMeta.invisible, false),
          invisibleAt: this.normalizeDate(rawMeta.invisibleAt),
        },
      };
    });
  }

  private resolveGroups(
    rawGroups: any,
    rawGroupEnrollments: string[],
    allGroups: Group[],
  ): Group[] {
    const groupsArray = this.asArray(rawGroups);

    if (groupsArray.length === 0) {
      if (!Array.isArray(rawGroupEnrollments) || rawGroupEnrollments.length === 0) {
        return [];
      }

      return rawGroupEnrollments
        .map((enrollment) =>
          allGroups.find(
            (group) =>
              group.id === enrollment || (group as any)?.enrollment === enrollment,
          ),
        )
        .filter((group): group is Group => !!group);
    }

    const groupsFromUserPayload = groupsArray
      .map((group: any) => {
        const enrollment = String(group?.enrollment ?? group?.id ?? '');
        if (!enrollment) return null;

        return {
          id: enrollment,
          title: group?.title ?? group?.name ?? '',
          description: group?.description ?? '',
          permissions: Array.isArray(group?.permissions)
            ? group.permissions.filter((value: unknown): value is string => typeof value === 'string')
            : [],
        } as Group;
      })
      .filter((group): group is Group => !!group);

    if (groupsFromUserPayload.length > 0) {
      return groupsFromUserPayload.map((group) => {
        const fullGroup = allGroups.find((item) => item.id === group.id);
        if (!fullGroup) return group;
        return fullGroup;
      });
    }

    return [];
  }

  private normalizeDate(value: unknown): string | null {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;

    return formatDateShortBR(date);
  }

  private asArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object' && Array.isArray((value as any).data)) {
      return (value as any).data as T[];
    }
    return [];
  }

  private parseBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    if (typeof value === 'number') return value !== 0;
    return fallback;
  }
}
