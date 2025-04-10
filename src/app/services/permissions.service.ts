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

  constructor(private translationService: TranslationService) { }

  // ------------------------------------------------------
  // SEÇÃO: CARREGAMENTO DE PERMISSÕES
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // SEÇÃO: CARREGAMENTO DE DADOS
  // ------------------------------------------------------

  private async loadPermissionsData() {
    return import('../../../public/assets/permissions/perm.json');
  }

  private async loadTranslations(language: string) {
    return import(`../../../public/assets/i18n/${language}.json`);
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
        critical: permission.critical,
      };
      return acc;
    }, {} as Record<string, Permission>);
  }

  // ------------------------------------------------------
  // SEÇÃO: FILTRAGEM DE PERMISSÕES
  // ------------------------------------------------------

  filterPermissionsByIds(permissions: Permissions, permissionIds: string[]): Permissions {
    const filteredPermissions: Permissions = {
      users: {},
      routes: {},
      admin: {}
    };

    filteredPermissions.users = this.filterCategoryPermissions(permissions.users, permissionIds);
    filteredPermissions.routes = this.filterCategoryPermissions(permissions.routes, permissionIds);
    filteredPermissions.admin = this.filterCategoryPermissions(permissions.admin, permissionIds);

    return filteredPermissions;
  }

  filterCategoryPermissions = (categoryPermissions: Record<string, Permission>, permissionIds: string[]): Record<string, Permission> => {
    
    const filteredCategory: Record<string, Permission> = {};

    Object.keys(categoryPermissions).forEach(key => {
      const permission = categoryPermissions[key];
      if (permissionIds.includes(permission.id)) {
        filteredCategory[key] = permission;
      }
    });

    return filteredCategory;
  };

  // ------------------------------------------------------
  // SEÇÃO: TRADUÇÃO DE PERMISSÕES
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // SEÇÃO: GESTÃO DE PERMISSÕES SELECIONADAS
  // ------------------------------------------------------

  getSelectedPermissions(): Record<string, boolean> {
    return this.selectedPermissions;
  }

  setSelectedPermission(id: string, checked: boolean): void {
    this.selectedPermissions[id] = checked;
  }
}
