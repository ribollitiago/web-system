import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

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
  private groups: Group[] = [];
  private selectedGroups = new Set<string>();

  constructor(private firebaseService: FirebaseService) {}

  // ------------------------------------------------------
  // CARREGAMENTO
  // ------------------------------------------------------

  async loadGroups(): Promise<Group[]> {
    if (this.groups.length) {
      return this.groups;
    }

    const groups = await this.firebaseService.getAllEntity('groups');

    this.groups = groups.map((group: any) => ({
      id: group.id,
      title: group.title,
      description: group.description,
      permissions: group.permissions ?? []
    }));

    return this.groups;
  }

  getGroups(): readonly Group[] {
    return this.groups;
  }

  // ------------------------------------------------------
  // SELEÇÃO
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
  // PERMISSÕES DERIVADAS
  // ------------------------------------------------------

  getPermissionsFromGroups(): string[] {
    const permissionSet = new Set<string>();

    this.getSelectedGroups().forEach(group => {
      group.permissions.forEach(p => permissionSet.add(p));
    });

    return Array.from(permissionSet);
  }

  // ------------------------------------------------------
  // PAYLOAD
  // ------------------------------------------------------

  buildPayload() {
    return {
      groups: this.getSelectedGroupIds(),
      permissions: this.getPermissionsFromGroups()
    };
  }
}
