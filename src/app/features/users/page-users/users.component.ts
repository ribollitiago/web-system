import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { SearchInputComponent } from '../../../shared/components/input/search-input/search-input.component';
import { ListUsersComponent } from '../list-users/list-users.component';
import { SituationChipComponent } from '../../../shared/components/chip/situation-chip/situation-chip.component';
import { GroupChipComponent } from '../../../shared/components/chip/group-chip/group-chip.component';
import { BorderButtonComponent } from "../../../shared/components/button/border-button/border-button.component";

import { TranslationService } from '../../../core/services/shared/translate.service';
import { PermissionsService } from '../../../core/services/components/permissions.service';
import { User } from '../../../core/services/components/users.service';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-details-users',
  standalone: true,
  imports: [
    CommonModule,
    SearchInputComponent,
    ListUsersComponent,
    MatTooltipModule,
    MatMenuModule,
    SituationChipComponent,
    GroupChipComponent,
    BorderButtonComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit, OnDestroy {

  @ViewChild(ListUsersComponent) listUsersComponent!: ListUsersComponent;

  title = '';
  subtitle = '';
  inputSearch = '';
  btnFilters = '';
  btnExport = '';

  menuTooltip = '';
  zeroTooltip = '';
  lowTooltip = '';
  mediumTooltip = '';
  highTooltip = '';

  currentSearchQuery = '';
  currentSelectedCount = 0;

  selectedUser: User | null = null;
  isDetailsOpen = false;

  permissionUserSelected: {
    title: string;
    critical: string;
    description: string;
  }[] = [];

  isFilterOpen = false;

  private languageSubscription: Subscription;

  constructor(
    private permissionsService: PermissionsService,
    private translationService: TranslationService
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  ngOnInit(): void {
    this.loadTranslations();
  }

  ngOnDestroy(): void {
    this.languageSubscription.unsubscribe();
  }

  // ------------------------------------------------------
  // TRANSLATIONS
  // ------------------------------------------------------

  private loadTranslations(): void {

    const globalSection = 'global_components';
    const usersSection = 'Users_Page';
    const permissionSection = 'Permissions_Page';

    this.menuTooltip = this.translationService.getTranslation('menuTooltip', permissionSection);
    this.zeroTooltip = this.translationService.getTranslation('criticalTooltipZeroLevel', permissionSection);
    this.lowTooltip = this.translationService.getTranslation('criticalTooltipLowLevel', permissionSection);
    this.mediumTooltip = this.translationService.getTranslation('criticalTooltipMediumLevel', permissionSection);
    this.highTooltip = this.translationService.getTranslation('criticalTooltipHighLevel', permissionSection);

    this.inputSearch = this.translationService.getTranslation('inputSearch', globalSection);

    this.title = this.translationService.getTranslation('title', usersSection);
    this.subtitle = this.translationService.getTranslation('subtitle', usersSection);
    this.btnFilters = this.translationService.getTranslation('btnFilters', usersSection);
    this.btnExport = this.translationService.getTranslation('btnExport', usersSection);
  }

  // ------------------------------------------------------
  // LIST EVENTS
  // ------------------------------------------------------

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
  }

  // ------------------------------------------------------
  // PERMISSIONS
  // ------------------------------------------------------

  listPermissions(user: User): void {

    const filtered = this.permissionsService.filterPermissionsByIds(
      this.permissionsService.getPermissions(),
      user.permissions
    );

    const permissions: {
      title: string;
      critical: string;
      description: string;
    }[] = [];

    Object.keys(filtered).forEach(category => {

      const categoryPermissions = filtered[category as keyof typeof filtered];

      if (categoryPermissions && Object.keys(categoryPermissions).length > 0) {

        Object.values(categoryPermissions).forEach((permission: any) => {

          if (permission.title) {
            permissions.push({
              title: permission.title,
              critical: permission.critical,
              description: permission.description
            });
          }
        });
      }
    });

    this.sortByCriticalLevel(permissions);
    this.permissionUserSelected = permissions;
  }

  private sortByCriticalLevel(permissions: { critical: string }[]): void {

    const levelOrder: Record<string, number> = {
      HIGH_LEVEL: 0,
      MEDIUM_LEVEL: 1,
      LOW_LEVEL: 2,
      ZERO_LEVEL: 3
    };

    permissions.sort((a, b) => {
      const aOrder = levelOrder[a.critical] ?? 3;
      const bOrder = levelOrder[b.critical] ?? 3;
      return aOrder - bOrder;
    });
  }

  getSvgFileName(critical: string): string {

    const mapping: Record<string, string> = {
      HIGH_LEVEL: 'high_level.svg',
      MEDIUM_LEVEL: 'medium_level.svg',
      LOW_LEVEL: 'low_level.svg',
      ZERO_LEVEL: 'zero_level.svg'
    };

    return `assets/svg/icon/register/step-2/${mapping[critical] || 'default.svg'}`;
  }

  getCriticalText(critical: string): string {

    switch (critical) {
      case 'HIGH_LEVEL': return this.highTooltip;
      case 'MEDIUM_LEVEL': return this.mediumTooltip;
      case 'LOW_LEVEL': return this.lowTooltip;
      case 'ZERO_LEVEL': return this.zeroTooltip;
      default: return '';
    }
  }

  // ------------------------------------------------------
  // FILTER POPUP
  // ------------------------------------------------------

  toggleFiltersPopup(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.currentSearchQuery = '';
  }

  applyFilters(): void {
    this.isFilterOpen = false;
  }
}