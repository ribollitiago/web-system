import { Injectable } from '@angular/core';
import { TranslationService } from '../i18n/translate.service';
import { PERMISSIONS } from '../../../config/permissions.config';
import { BehaviorSubject, Observable } from 'rxjs';

export type CriticalLevel = 'HIGH_LEVEL' | 'MEDIUM_LEVEL' | 'LOW_LEVEL' | 'ZERO_LEVEL';

export interface Permission {
  id: string;
  critical: CriticalLevel;
  title?: string;
  description?: string;
  checked?: boolean;
}

export interface Permissions {
  users: Record<string, Permission>;
  routes: Record<string, Permission>;
  admin: Record<string, Permission>;
}

function isCriticalLevel(value: string): value is CriticalLevel {
  return ['HIGH_LEVEL', 'MEDIUM_LEVEL', 'LOW_LEVEL', 'ZERO_LEVEL'].includes(value);
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private selectedPermissions: Record<string, boolean> = {};
  private lockedPermissions$ = new BehaviorSubject<Set<string>>(new Set());

  constructor(private translationService: TranslationService) { }

  // ------------------------------------------------------
  // SEÇÃO: CARREGAMENTO DE PERMISSÕES
  // ------------------------------------------------------

  getPermissions(): Permissions {
    try {
      const categorizedPermissions: Permissions = {
        users: this.mapPermissions(PERMISSIONS.users),
        routes: this.mapPermissions(PERMISSIONS.routes),
        admin: this.mapPermissions(PERMISSIONS.admin),
      };

      this.translatePermissions(categorizedPermissions);

      return categorizedPermissions;
    } catch (error) {
      console.error('Erro ao processar permissões:', error);
      throw new Error('Falha ao carregar as permissões.');
    }
  }

  clearSelectedPermissions(): void {
    this.selectedPermissions = {};
  }

  // ------------------------------------------------------
  // SEÇÃO: MAPEAMENTO DE PERMISSÕES
  // ------------------------------------------------------

  private mapPermissions(permissions: Record<string, any>): Record<string, Permission> {
    return Object.keys(permissions).reduce((acc, key) => {
      const permission = permissions[key];

      if (!isCriticalLevel(permission.critical)) {
        throw new Error(`Nível crítico inválido: ${permission.critical}`);
      }

      acc[key] = {
        ...permission,
        critical: permission.critical as CriticalLevel,
      };
      return acc;
    }, {} as Record<string, Permission>);
  }

  // ------------------------------------------------------
  // SEÇÃO: FILTRAGEM DE PERMISSÕES
  // ------------------------------------------------------

  filterPermissionsByIds(permissions: Permissions, permissionIds: string[]): Permissions {
    return {
      users: this.filterCategoryPermissions(permissions.users, permissionIds),
      routes: this.filterCategoryPermissions(permissions.routes, permissionIds),
      admin: this.filterCategoryPermissions(permissions.admin, permissionIds)
    };
  }

  private filterCategoryPermissions(categoryPermissions: Record<string, Permission>, permissionIds: string[]): Record<string, Permission> {
    const filteredCategory: Record<string, Permission> = {};

    Object.keys(categoryPermissions).forEach(key => {
      const permission = categoryPermissions[key];
      if (permissionIds.includes(permission.id)) {
        filteredCategory[key] = permission;
      }
    });

    return filteredCategory;
  }

  // ------------------------------------------------------
  // SEÇÃO: TRADUÇÃO DE PERMISSÕES
  // ------------------------------------------------------

  private translatePermissions(categorizedPermissions: Permissions) {
    (Object.keys(categorizedPermissions) as (keyof Permissions)[]).forEach(category => {
      const categoryPermissions = categorizedPermissions[category];

      Object.keys(categoryPermissions).forEach(permissionKey => {
        const permission = categoryPermissions[permissionKey];

        const translatedObj: any = this.translationService.getTranslation(permission.id, 'Permissions');

        if (translatedObj) {
          permission.title = translatedObj.title || '';
          permission.description = translatedObj.description || '';
        }
      });
    });
  }

  // ------------------------------------------------------
  // SEÇÃO: GESTÃO DE PERMISSÕES SELECIONADAS
  // ------------------------------------------------------

  getSelectedPermissions(): Record<string, boolean> {
    return this.selectedPermissions;
  }

  setSelectedPermission(id: string, checked: boolean): void {
    this.selectedPermissions[id] = checked;
  }

  // ------------------------------------------------------
  // SEÇÃO: GESTÃO DE PERMISSÕES TRAVADAS
  // ------------------------------------------------------

  getLockedPermissions$(): Observable<Set<string>> {
    return this.lockedPermissions$.asObservable();
  }

  getLockedPermissions(): Set<string> {
    return this.lockedPermissions$.value;
  }

  setLockedPermission(id: string, locked: boolean) {
    const newSet = new Set(this.lockedPermissions$.value);
    locked ? newSet.add(id) : newSet.delete(id);
    this.lockedPermissions$.next(newSet);
  }
}
