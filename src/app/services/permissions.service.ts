import { Injectable } from '@angular/core';
import { TranslationService } from './translate.service';

interface Permission {
  critical: string;
  id: string;
  title?: string;
  description?: string;
}

interface Permissions {
  users: { [key: string]: Permission };
  routes: { [key: string]: Permission };
  admin: { [key: string]: Permission };
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(private translationService: TranslationService) {}

  async getPermissions() {
    try {
      const permissions = await import('../../../public/assets/permissions/perm.json');
      const currentLanguage = this.translationService.getCurrentLanguage();
      const translate = await import(`../../../public/assets/i18n/${currentLanguage}.json`);

      const categorizedPermissions: Permissions = {
        users: permissions.users,
        routes: permissions.routes,
        admin: permissions.admin
      };

      for (const category of Object.keys(categorizedPermissions) as (keyof Permissions)[]) {
        for (const permissionKey of Object.keys(categorizedPermissions[category]) as string[]) {
          const permission = categorizedPermissions[category][permissionKey];
          const permissionId = permission.id;

          const translation = translate.Permissions_Page.permissions[permissionId];

          if (translation) {
            permission.title = translation.title || '';
            permission.description = translation.description || '';
          }
        }
      }
      console.log(categorizedPermissions);

      return categorizedPermissions;

    } catch (error) {
      console.error('Erro ao carregar permissões ou tradução:', error);
      throw error;
    }
  }
}
