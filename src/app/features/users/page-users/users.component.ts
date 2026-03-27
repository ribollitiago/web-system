import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

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
import {
  DefaultFilterListComponent,
  DefaultFilterSection,
  DefaultFixedDateConfig
} from "../../../shared/components/filter/default-filter-list/default-filter-list.component";
import { GroupsService } from '../../../core/services/components/groups.service';

import { exportService } from '../../../core/services/shared/export.service';
import { detectDeviceFromUserAgent } from '../../../core/utils/device.utils';
import { ExportListComponent } from "../../../shared/components/export-list/export-list.component";

@Component({
  selector: 'app-details-users',
  standalone: true,
  imports: [
    SearchInputComponent,
    ListUsersComponent,
    MatTooltipModule,
    MatMenuModule,
    SituationChipComponent,
    GroupChipComponent,
    BorderButtonComponent,
    DefaultFilterListComponent,
    ExportListComponent
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
  isExportOpen = false;

  selectedUsers: any[] = [];
  allUsers: any[] = [];

  filtersSections: DefaultFilterSection[] = [
    {
      title: 'Status',
      fields: [
        {
          key: 'status',
          label: 'Status',
          kind: 'radio',
          options: [
            { label: 'Online', value: 'ONLINE' },
            { label: 'Offline', value: 'OFFLINE' }
          ]
        }
      ]
    },
    {
      title: 'Situation',
      fields: [
        {
          key: 'situation',
          label: 'Situation',
          kind: 'radio',
          options: [
            { label: 'Ativo', value: 'ACTIVE' },
            { label: 'Bloqueado', value: 'BLOCKED' }
          ]
        }
      ]
    },
    {
      title: 'Grupo',
      fields: [
        {
          key: 'groups',
          label: 'Selecione os Grupos',
          kind: 'group',
          options: []
        }
      ]
    },
    {
      title: 'Último login',
      fields: [
        {
          key: 'lastLogin',
          label: 'Último login',
          kind: 'group',
          mode: 'radio',
          options: [
            { label: 'Hoje', value: 'TODAY' },
            { label: '7 dias', value: '7D' },
            { label: '30 dias', value: '30D' },
            { label: 'Intervalo', value: 'RANGE' }
          ]
        }
      ]
    },
    {
      title: 'Dispositivos',
      fields: [
        {
          key: 'device',
          label: 'Selecione os Dispositivos',
          kind: 'group',
          mode: 'checkbox',
          options: [
            { label: 'Mac', value: 'MAC' },
            { label: 'Windows', value: 'WINDOWS' },
            { label: 'Mobile', value: 'MOBILE' },
            { label: 'Linux', value: 'LINUX' },
          ]
        }
      ]
    },
  ];

  fixedDate: DefaultFixedDateConfig = {
    label: 'Criado em',
    fromKey: 'createdFrom',
    toKey: 'createdTo'
  };

  filtersModel: Record<string, any> = {
    status: [],
    situation: [],
    groups: [],
    device: [],
    lastLogin: null,
    createdFrom: null,
    createdTo: null
  };

  private languageSubscription: Subscription;

  constructor(
    private permissionsService: PermissionsService,
    private translationService: TranslationService,
    private groupsService: GroupsService,
    private exportService: exportService
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  async ngOnInit(): Promise<void> {
    this.loadTranslations();
    await this.loadGroupFilterOptions();
  }

  ngOnDestroy(): void {
    this.languageSubscription.unsubscribe();
  }

  private async loadGroupFilterOptions(): Promise<void> {

    const groups = await this.groupsService.getGroupsOnce();

    const groupOptions = groups.map(group => ({
      label: group.title,
      value: group.id
    }))

    this.setDynamicGroupOptions(groupOptions);
  }

  private setDynamicGroupOptions(options: any[]): void {

    this.filtersSections.forEach(section => {
      section.fields.forEach(field => {
        if (field.key === 'groups') {
          field.options = options;
        }
      });
    });
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

    this.selectedUsers = users;

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
  // POPUP UTILS
  // ------------------------------------------------------

  toggleFiltersPopup(): void {
    this.isFilterOpen = !this.isFilterOpen;
    if (this.isFilterOpen) {
      // make sure export is closed when filter opens
      this.isExportOpen = false;
    }
  }

  clearUserFilters(): void {
    this.filtersModel = {
      status: [],
      situation: [],
      group: [],
      device: [],
      lastLogin: null,
      createdFrom: null,
      createdTo: null
    };
  }

  clearSelectedUsers(): void {
    if (this.listUsersComponent) {
      this.listUsersComponent.clearSelection();
    }
    this.currentSelectedCount = 0;
    this.selectedUser = null;
  }

  applyUserFilters(model: Record<string, any>): void {
    this.filtersModel = { ...model };
    this.isFilterOpen = false;
  }

  toggleExportPopup(): void {
    this.isExportOpen = !this.isExportOpen;
    if (this.isExportOpen) {
      this.isFilterOpen = false;
    }
  }

  exportUsers(users: User[]): void {

    const allPermissions = this.permissionsService.getPermissions();

    const formatted = users.map(user => {

      // -----------------------------
      // PERMISSIONS (converter ID → title)
      // -----------------------------
      const filteredPermissions = this.permissionsService
        .filterPermissionsByIds(allPermissions, user.permissions);

      const permissionTitles: string[] = [];

      Object.values(filteredPermissions).forEach(category => {
        if (category) {
          Object.values(category).forEach((perm: any) => {
            if (perm.title) permissionTitles.push(perm.title);
          });
        }
      });

      permissionTitles.sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      );

      // -----------------------------
      // DEVICE (userAgent → nome amigável)
      // -----------------------------
      const device = user?.session?.device
        ? detectDeviceFromUserAgent(user.session.device)
        : '';

      // -----------------------------
      // RETURN ORGANIZED OBJECT
      // (A ORDEM AQUI DEFINE A ORDEM NO CSV)
      // -----------------------------
      return {
        Matrícula: user.enrollment ?? '',
        Nome: user.name ?? '',
        Email: user.email ?? '',
        Telefone: user.phone ?? '',
        Grupos: user.groups?.map(g => g.title).join(', ') ?? '',
        Permissões: permissionTitles.join(', '),

        Status: user.session?.isOnline ? 'Online' : 'Offline',
        Situação: user.session?.blocked ? 'Bloqueado' : 'Ativo',
        Dispositivo: device,

        'Último Login': user.session?.lastLogin ?? '',
        'Criado Em': user.createdAt ?? '',
        Descrição: user.description ?? ''
      };
    });

    this.exportService.exportToCsv(formatted, 'usuarios');
  }

  exportSelectedUsers(): void {

    if (!this.selectedUsers || this.selectedUsers.length === 0) return;
    this.exportUsers(this.selectedUsers);

  }

  exportAllUsers(): void {

    if (!this.listUsersComponent?.filteredUsers?.length) return;

    this.exportUsers(this.listUsersComponent.filteredUsers);
  }
}
