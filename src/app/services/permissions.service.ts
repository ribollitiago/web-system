import { Injectable } from '@angular/core';
import { TranslationService } from './translate.service';

export type CriticalLevel = 'HIGH_LEVEL' | 'MEDIUM_LEVEL' | 'LOW_LEVEL' | 'ZERO_LEVEL';

interface Permission {
  id: string;
  critical: CriticalLevel;
  title?: string;
  description?: string;
  checked?: boolean;
}

function isCriticalLevel(value: string): value is CriticalLevel {
  return ['HIGH_LEVEL', 'MEDIUM_LEVEL', 'LOW_LEVEL', 'ZERO_LEVEL'].includes(value);
}

interface Permissions {
  users: Record<string, Permission>;
  routes: Record<string, Permission>;
  admin: Record<string, Permission>;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private selectedPermissions: Record<string, boolean> = {};

  constructor(private translationService: TranslationService) {}

  async getPermissions(): Promise<Permissions> {
    try {
      const permissionsData = await this.loadPermissionsData();
      const currentLanguage = this.translationService.getCurrentLanguage();
      const translations = await this.loadTranslations(currentLanguage);

      const categorizedPermissions: Permissions = {
        users: this.mapPermissions(permissionsData.users),
        routes: this.mapPermissions(permissionsData.routes),
        admin: this.mapPermissions(permissionsData.admin),
      };

      this.translatePermissions(categorizedPermissions, translations);

      return categorizedPermissions;
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      throw new Error('Falha ao carregar as permissões.');
    }
  }

  private async loadPermissionsData() {
    return import('../../../public/assets/permissions/perm.json');
  }

  private async loadTranslations(language: string) {
    return import(`../../../public/assets/i18n/${language}.json`);
  }

  private mapPermissions(permissions: Record<string, any>): Record<string, Permission> {
    return Object.keys(permissions).reduce((acc, key) => {
      const permission = permissions[key];
      if (!isCriticalLevel(permission.critical)) {
        throw new Error(`Nível crítico inválido: ${permission.critical}`);
      }
      acc[key] = {
        ...permission,
        critical: permission.critical,
      };
      return acc;
    }, {} as Record<string, Permission>);
  }

  private translatePermissions(categorizedPermissions: Permissions, translate: any) {
    for (const category of Object.keys(categorizedPermissions) as (keyof Permissions)[]) {
      const categoryPermissions = categorizedPermissions[category];

      const categoryTranslations = translate.Permissions_Page.permissions;

      for (const permissionKey of Object.keys(categoryPermissions) as string[]) {
        const permission = categoryPermissions[permissionKey];
        const permissionId = permission.id;

        const translation = categoryTranslations?.[permissionId];

        if (translation) {
          permission.title = translation.title || '';
          permission.description = translation.description || '';
        }
      }
    }
  }

  getSelectedPermissions(): Record<string, boolean> {
    return this.selectedPermissions;
  }

  setSelectedPermission(id: string, checked: boolean): void {
    this.selectedPermissions[id] = checked;
  }
}
