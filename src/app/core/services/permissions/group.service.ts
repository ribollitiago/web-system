import { Injectable } from '@angular/core';
import { FirebaseService } from '../database/firebase.service';
import { BehaviorSubject } from 'rxjs';

// ------------------------------------------------------
// SEÇÃO: INTERFACES
// ------------------------------------------------------

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
  // SEÇÃO: ESTADO
  // ------------------------------------------------------

  private groups: Group[] = [];
  private selectedGroups = new Set<string>();

  // ------------------------------------------------------
  // SEÇÃO: CONSTRUTOR
  // ------------------------------------------------------

  constructor(private firebaseService: FirebaseService) { }

  // ------------------------------------------------------
  // SEÇÃO: CARREGAMENTO
  // ------------------------------------------------------

  async unSubscribeGroups() {
    this.firebaseService.offSubscription('groups');
  }

  async subscribeGroups(): Promise<Group[]> {
    if (this.groups.length) return this.groups;

    return new Promise<Group[]>((resolve) => {
      this.firebaseService.subscribeToGroups((groups: any[]) => {
        this.groups = this.formatGroups(groups);
        resolve(this.groups);
      });
    });
  }

  getGroups(): readonly Group[] {
    return this.groups;
  }

  // ------------------------------------------------------
  // SEÇÃO: SELEÇÃO
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
  // SEÇÃO: PERMISSÕES
  // ------------------------------------------------------

  getPermissionsFromGroups(): string[] {
    const permissionSet = new Set<string>();

    this.getSelectedGroups().forEach(group => {
      group.permissions.forEach(p => permissionSet.add(p));
    });

    return Array.from(permissionSet);
  }

  // ------------------------------------------------------
  // SEÇÃO: PAYLOAD
  // ------------------------------------------------------

  buildPayload() {
    return {
      groups: this.getSelectedGroupIds(),
      permissions: this.getPermissionsFromGroups()
    };
  }

  // ------------------------------------------------------
  // SEÇÃO: FORMATAÇÃO
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