import { Injectable } from '@angular/core';
import { FirebaseService } from '../database/firebase.service';

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

  // ------------------------------------------------------
  // START STATE
  // ------------------------------------------------------

  private groups: Group[] = [];
  private selectedGroups = new Set<string>();

  constructor(private firebaseService: FirebaseService) { }

  // ------------------------------------------------------
  // START DATA LOAD
  // ------------------------------------------------------

  async unSubscribeGroups() {
    this.firebaseService.unsubscribe('groups');
  }

  async subscribeGroups(): Promise<Group[]> {

    if (this.groups.length) return this.groups;

    return new Promise<Group[]>((resolve) => {
      this.firebaseService.subscribe('groups', (groups: any[]) => {
        this.groups = this.formatGroups(groups || []);
        resolve(this.groups);
      });
    });
  }

  async getGroupsOnce(): Promise<Group[]> {

    const groups = await this.firebaseService.getList('groups') ?? [];

    return this.formatGroups(groups);
  }

  getGroups(): readonly Group[] {
    return this.groups;
  }

  // ------------------------------------------------------
  // START SELECTION CONTROL
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // START PERMISSION RESOLVER
  // ------------------------------------------------------

  getPermissionsFromGroups(): string[] {

    const permissionSet = new Set<string>();

    this.getSelectedGroups().forEach(group => {
      group.permissions.forEach(p => permissionSet.add(p));
    });

    return Array.from(permissionSet);
  }

  // ------------------------------------------------------
  // START PAYLOAD BUILDER
  // ------------------------------------------------------

  buildPayload() {
    return {
      groups: this.getSelectedGroupIds(),
      permissions: this.getPermissionsFromGroups()
    };
  }

  // ------------------------------------------------------
  // START MAPPERS
  // ------------------------------------------------------

  private formatGroups(groups: any[]): Group[] {
    return groups.map(group => ({
      id: group.id,
      title: group.title,
      description: group.description,
      permissions: group.permissions ?? []
    }));
  }
}
