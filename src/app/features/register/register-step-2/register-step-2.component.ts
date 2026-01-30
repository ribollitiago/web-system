// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import { TranslationService } from '../../../core/services/i18n/translate.service';
import { RegisterService } from '../../../core/services/auth/register.service';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { GroupsService, Group } from '../../../core/services/permissions/group.service';

import { SearchInputComponent } from '../../../shared/components/input/search-input/search-input.component';
import { StepsFilterComponent } from '../steps-filter/steps-filter.component';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';
import {
  DefaultDropdownComponent,
  DropdownOption
} from '../../../shared/components/dropdown/default-dropdown/default-dropdown.component';

import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';


// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
@Component({
  selector: 'app-register-step-2',
  imports: [
    CommonModule,
    SearchInputComponent,
    StepsFilterComponent,
    DefaultStepComponent,
    DefaultDropdownComponent,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './register-step-2.component.html',
  styleUrl: './register-step-2.component.scss',
})
export class RegisterStep2Component implements OnDestroy {

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------
  selectedButton = 'users';
  currentSearchQuery = '';

  title = '';
  subtitle = '';
  filterOne = '';
  filterTwo = '';
  filterThree = '';
  titleGroupPermissions = '';
  titleSelectPermissions = '';
  inputGroupPermissions = '';
  inputSearch = '';
  btnLast = '';

  groupOptions: DropdownOption[] = [];
  private allGroups: Group[] = [];
  isGroupDropdownDisabled = false;

  lockedPermissions$!: Observable<Set<string>>;

  get selectedGroups(): Group[] {
    return this.groupsService.getSelectedGroups();
  }

  separatorKeysCodes: number[] = [13, 188];
  itemCtrl = new FormControl('');
  filteredItems: Observable<string[]>;
  selectedItems: string[] = [];
  allItems: string[] = [];

  @ViewChild('itemInput') itemInput!: ElementRef<HTMLInputElement>;

  private languageSubscription: Subscription;

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------
  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private permissionsService: PermissionsService,
    private groupsService: GroupsService
  ) {
    this.languageSubscription =
      this.translationService.language$.subscribe(() => {
        this.loadTranslations();
      });

    this.filteredItems = this.itemCtrl.valueChanges.pipe(
      startWith(null),
      map(value => value ? this.filterItems(value) : this.allItems.slice())
    );
  }

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    this.lockedPermissions$ = this.permissionsService.getLockedPermissions$();

    this.registerService.data$.subscribe(allData => {
      const data = allData['users'] || {};
      if (Object.keys(data).length === 0) {
        this.permissionsService.clearSelectedPermissions();
        this.groupsService.clearSelectedGroups();
        this.updateGroupOptions();
      }
    });

    this.loadTranslations();
    this.loadGroups();
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
    this.groupsService.unSubscribeGroups();
  }

  // ------------------------------------------------------
  // CHIPS
  // ------------------------------------------------------
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) this.selectedItems.push(value);

    event.chipInput!.clear();
    this.itemCtrl.setValue(null);
  }

  remove(item: string): void {
    const index = this.selectedItems.indexOf(item);
    if (index >= 0) this.selectedItems.splice(index, 1);
  }

  selected(event: any): void {
    this.selectedItems.push(event.option.viewValue);
    this.itemInput.nativeElement.value = '';
    this.itemCtrl.setValue(null);
  }

  private filterItems(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allItems.filter(item =>
      item.toLowerCase().includes(filterValue)
    );
  }

  // ------------------------------------------------------
  // TRANSLATIONS
  // ------------------------------------------------------
  private loadTranslations(): void {
    const section = 'Permissions_Page';

    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);
    this.filterOne = this.translationService.getTranslation('filterOne', section);
    this.filterTwo = this.translationService.getTranslation('filterTwo', section);
    this.filterThree = this.translationService.getTranslation('filterThree', section);
    this.inputGroupPermissions =
      this.translationService.getTranslation('inputGroupPermissions', section);
    this.titleGroupPermissions =
      this.translationService.getTranslation('titleGroupPermissions', section);
    this.titleSelectPermissions =
      this.translationService.getTranslation('titleSelectPermissions', section);

    this.btnLast =
      this.translationService.getTranslation('btnRegister', 'Register_Page');
    this.inputSearch =
      this.translationService.getTranslation('inputSearch', 'Global_Components');
  }

  // ------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------
  selectButton(buttonName: string): void {
    this.selectedButton = buttonName;
  }

  handleSearchChange(query: string): void {
    this.currentSearchQuery = query;
  }

  handlePermissionSelection(
    selectedPermission: { id: string; checked?: boolean }
  ): void {
    this.permissionsService.setSelectedPermission(
      selectedPermission.id,
      !!selectedPermission.checked
    );
  }

  handleGroupSelected(option: DropdownOption): void {
    if (!option) return;
    if (this.groupsService.isGroupSelected(option.value)) return;

    this.groupsService.selectGroup(option.value);

    option.permissions?.forEach(permissionId => {
      this.permissionsService.setLockedPermission(permissionId, true);
    });

    this.updateGroupOptions();
  }

  removeGroup(groupId: string): void {
    const group = this.groupsService
      .getSelectedGroups()
      .find(g => g.id === groupId);

    if (!group) return;

    group.permissions.forEach(permissionId => {
      this.permissionsService.setLockedPermission(permissionId, false);
    });

    this.groupsService.unselectGroup(groupId);
    this.updateGroupOptions();
  }

  // ------------------------------------------------------
  // GROUPS
  // ------------------------------------------------------
  private updateGroupOptions(): void {
    const selectedIds = new Set(
      this.groupsService.getSelectedGroupIds()
    );

    this.groupOptions = this.allGroups
      .filter(group => !selectedIds.has(group.id))
      .map(group => ({
        label: group.title,
        value: group.id,
        permissions: group.permissions
      }));

    this.isGroupDropdownDisabled = this.groupOptions.length === 0;
  }

  async loadGroups(): Promise<void> {
    this.allGroups = await this.groupsService.subscribeGroups();
    this.updateGroupOptions();
  }

  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  async submit(): Promise<void> {
    const permissions: string[] = [];

    const selectedPermissions = this.permissionsService.getSelectedPermissions();
    for (const [id, checked] of Object.entries(selectedPermissions)) {
      if (checked) {
        permissions.push(id);
      }
    }

    const groups: string[] = [];

    const selectedGroups = this.groupsService.getSelectedGroupIds();
    for (const id of selectedGroups) {
      groups.push(id);
    }

    this.registerService.updateData('users', {
      permissions,
      groups
    });

    this.registerService.nextStep('users');
  }
}
