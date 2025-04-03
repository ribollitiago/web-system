import { Component, OnDestroy, ViewChild } from '@angular/core';
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { TranslationService } from '../../../services/translate.service';
import { filter, Subscription } from 'rxjs';
import { ListUsersComponent, User } from "../../../components/users/list-users/list-users.component";
import { CommonModule } from '@angular/common';
import { PermissionsService } from '../../../services/permissions.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SearchInputComponent, ListUsersComponent, CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnDestroy {
  @ViewChild(ListUsersComponent) listUsersComponent!: ListUsersComponent;

  title: string = '';
  subtitle: string = '';
  inputSearch: string = '';
  btnFilters: string = '';
  btnExport: string = '';

  currentSearchQuery: string = '';
  currentSelectedCount: number = 0;
  selectedUser: User | null = null;
  isDetailsOpen: boolean = false;

  permissionUserSelected: any;

  private languageSubscription: Subscription;

  constructor(
    private permissionsService: PermissionsService,
    private translationService: TranslationService
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  async ngOnInit() {
    this.loadTranslations();
    // const permissionIds = ['010003', '020002', '030003'];
    // const filtered = this.permissionsService.filterPermissionsByIds(await this.permissionsService.getPermissions(), permissionIds);
    // console.log('Permissões filtradas:', JSON.stringify(filtered, null, 2));
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private loadTranslations(): void {
    const globalSection = 'Global_Components';
    const usersSection = 'Users_Page';

    this.inputSearch = this.translationService.getTranslation('inputSearch', globalSection);
    this.title = this.translationService.getTranslation('title', usersSection);
    this.subtitle = this.translationService.getTranslation('subtitle', usersSection);
    this.btnFilters = this.translationService.getTranslation('btnFilters', usersSection);
    this.btnExport = this.translationService.getTranslation('btnExport', usersSection);
  }

  handleSearchChange(query: string): void {
    this.currentSearchQuery = query;
  }

  handleSelectedCount(count: number): void {
    this.currentSelectedCount = count;
  }

  handleSelectedUsers(users: User[]): void {
    this.selectedUser = users.length === 1 ? users[0] : null;
    this.isDetailsOpen = !!this.selectedUser;
    if (this.selectedUser) {
      this.listPermissions(this.selectedUser);
    }
  }

  closeDetailsPanel(): void {
    this.isDetailsOpen = false;
    this.selectedUser = null;
    this.listUsersComponent?.resetSelections();
  }

  getSituationIcon(situation: string): string {
    const iconMap: Record<string, string> = {
      '1': 'situation-actived.svg',
      '-1': 'situation-disabled.svg',
      '0': 'situation-inactived.svg'
    };
    return `assets/svg/icon/users/${iconMap[situation] || 'situation-inactived.svg'}`;
  }

  translateSituation(situation: string): string {
    const situationMap: Record<string, string> = {
      '1': 'actived',
      '0': 'inactived',
      '-1': 'disabled'
    };
    return this.translationService.getTranslation(situationMap[situation], 'Users_Page');
  }

  async listPermissions(user: User) {
    const filtered = this.permissionsService.filterPermissionsByIds(
      await this.permissionsService.getPermissions(),
      user.permissions
    );

    const permissions: any[] = []; // Mudamos para array de objetos

    Object.keys(filtered).forEach(category => {
      const categoryPermissions = filtered[category as keyof typeof filtered];

      if (categoryPermissions && Object.keys(categoryPermissions).length > 0) {
        Object.values(categoryPermissions).forEach(permission => {
          if (permission.title) {
            permissions.push({
              title: permission.title,
              critical: permission.critical
            });
          }
        });
      }
    });

    this.sortByCriticalLevel(permissions);
    this.permissionUserSelected = permissions;
  }

  private sortByCriticalLevel(permissions: any[]) {
    const levelOrder: { [key: string]: number } = {
      'HIGH_LEVEL': 0,
      'MEDIUM_LEVEL': 1,
      'LOW_LEVEL': 2,
      'ZERO_LEVEL': 3
    };

    permissions.sort((a, b) => {
      const aOrder = levelOrder[a.critical] ?? 3;
      const bOrder = levelOrder[b.critical] ?? 3;
      return aOrder - bOrder;
    });
  }

  getSvgFileName(critical: string): string {
    const mapping: { [key: string]: string } = {
      HIGH_LEVEL: 'high_level.svg',
      MEDIUM_LEVEL: 'medium_level.svg',
      LOW_LEVEL: 'low_level.svg',
      ZERO_LEVEL: 'zero_level.svg'
    };
    return `assets/svg/icon/register/step-2/${mapping[critical] || 'default.svg'}`;
  }
}
