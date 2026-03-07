import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../database/realtime.service';

export interface Group {
  id: string;
  title: string;
  description?: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  groups$ = this.groupsSubject.asObservable();

  private groups: Group[] = [];
  private selectedGroups = new Set<string>();
  private realtimeSubscribed = false;

  private readonly handleGroupChanged = () => {
    this.refreshGroups();
  };

  constructor(
    private databaseService: DatabaseService,
    private realtimeService: RealtimeService
  ) { }

  async subscribe(): Promise<void> {
    await this.refreshGroups();
    this.attachRealtime();
  }

  unSubscribe(): void {
    if (!this.realtimeSubscribed) return;

    this.realtimeService.off('group_created', this.handleGroupChanged);
    this.realtimeService.off('group_updated', this.handleGroupChanged);
    this.realtimeSubscribed = false;
  }

  async getGroupsOnce(): Promise<Group[]> {
    const groups = await this.databaseService.getList('groups') as any[] ?? [];
    return this.formatGroups(groups);
  }

  getGroups(): readonly Group[] {
    return this.groups;
  }

  selectGroup(groupId: string): void {
    this.selectedGroups.add(groupId);
  }

  unselectGroup(groupId: string): void {
    this.selectedGroups.delete(groupId);
  }

  setSelectedGroups(groupIds: string[]): void {
    this.selectedGroups = new Set(groupIds);
  }

  clearSelectedGroups(): void {
    this.selectedGroups.clear();
  }

  isGroupSelected(groupId: string): boolean {
    return this.selectedGroups.has(groupId);
  }

  getSelectedGroupIds(): string[] {
    return Array.from(this.selectedGroups);
  }

  getSelectedGroups(): Group[] {
    return this.groups.filter(g => this.selectedGroups.has(g.id));
  }

  getPermissionsFromGroups(): string[] {
    const permissionSet = new Set<string>();

    this.getSelectedGroups().forEach(group => {
      group.permissions.forEach(p => permissionSet.add(p));
    });

    return Array.from(permissionSet);
  }

  buildPayload() {
    return {
      groups: this.getSelectedGroupIds(),
      permissions: this.getPermissionsFromGroups()
    };
  }

  private async refreshGroups() {
    const rawGroups = await this.databaseService.getList('groups') as any[] ?? [];
    this.groups = this.formatGroups(rawGroups);
    this.groupsSubject.next(this.groups);
  }

  private attachRealtime() {
    if (this.realtimeSubscribed) return;

    this.realtimeService.on('group_created', this.handleGroupChanged);
    this.realtimeService.on('group_updated', this.handleGroupChanged);
    this.realtimeSubscribed = true;
  }

  private formatGroups(groups: any[]): Group[] {
    return groups.map(group => {
      const permissionCodes = Array.isArray(group.permissions)
        ? group.permissions
          .map((permissionRef: any) =>
            typeof permissionRef === 'string'
              ? permissionRef
              : permissionRef?.permission?.code
          )
          .filter((code: unknown): code is string => typeof code === 'string')
        : [];

      return {
        id: String(group.enrollment ?? ''),
        title: group.title ?? '',
        description: group.description ?? '',
        permissions: permissionCodes
      };
    });
  }
}
