import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { map, Observable, startWith, Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/translate.service';
import { RegisterService } from '../../../core/services/register.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { CommonModule } from '@angular/common';
import { StepsFilterComponent } from '../steps-filter/steps-filter.component';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';
import { DefaultDropdownComponent, DropdownOption } from "../../../shared/components/default-dropdown/default-dropdown.component";
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FormControl } from '@angular/forms';
import { Group, GroupsService } from '../../../core/services/group.service';

@Component({
  selector: 'app-register-step-2',
  imports: [
    SearchInputComponent,
    CommonModule,
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
  selectedButton: string = 'users';
  currentSearchQuery: string = '';
  title: string = '';
  subtitle: string = '';

  groupTitle: string = 'Selecione os grupos de permissões para o usuário';
  groupOptions: DropdownOption[] = [];
  get selectedGroups(): Group[] {
    return this.groupsService.getSelectedGroups();
  }

  separatorKeysCodes: number[] = [13, 188];
  itemCtrl = new FormControl('');
  filteredItems: Observable<string[]>;
  selectedItems: string[] = [];
  allItems: string[] = [];

  @ViewChild('itemInput') itemInput!: ElementRef<HTMLInputElement>;

  permissionsTitle: string = 'Selecione as permissões individuais para o usuário';
  lockedPermissions = new Set<string>();
  btnLast: string = '';
  inputSearch: string = '';
  filterOne: string = '';
  filterTwo: string = '';
  filterThree: string = '';

  private languageSubscription: Subscription;

  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private permissionsService: PermissionsService,
    private groupsService: GroupsService
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });

    this.filteredItems = this.itemCtrl.valueChanges.pipe(
      startWith(null),
      map((item: string | null) => (item ? this._filter(item) : this.allItems.slice())),
    );
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.selectedItems.push(value);
    }

    event.chipInput!.clear();

    this.itemCtrl.setValue(null);
  }

  remove(item: string): void {
    const index = this.selectedItems.indexOf(item);

    if (index >= 0) {
      this.selectedItems.splice(index, 1);
    }
  }

  selected(event: any): void {
    this.selectedItems.push(event.option.viewValue);
    this.itemInput.nativeElement.value = '';
    this.itemCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allItems.filter(item => item.toLowerCase().includes(filterValue));
  }

  ngOnInit() {
    this.loadTranslations();
    this.loadGroups();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private loadTranslations(): void {
    const section = 'Permissions_Page';
    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);

    this.filterOne = this.translationService.getTranslation('filterOne', section);
    this.filterTwo = this.translationService.getTranslation('filterTwo', section);
    this.filterThree = this.translationService.getTranslation('filterThree', section);

    const section2 = 'Register_Page';
    this.btnLast = this.translationService.getTranslation('btnRegister', section2);

    const section3 = 'Global_Components'
    this.inputSearch = this.translationService.getTranslation('inputSearch', section3);
  }

  selectButton(buttonName: string): void {
    this.selectedButton = buttonName;
  }

  async submit(): Promise<void> {
    const permissions = Object.entries(this.permissionsService.getSelectedPermissions())
      .filter(([_, checked]) => checked)
      .reduce<Record<string, boolean>>((acc, [id]) => {
        acc[id] = true;
        return acc;
      }, {});

    const groups = this.groupsService
      .getSelectedGroupIds()
      .reduce<Record<string, boolean>>((acc, id) => {
        acc[id] = true;
        return acc;
      }, {});

    await this.registerService.setStepData(2, {
      permissions,
      groups
    });
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

    console.log('Permissão selecionada:', selectedPermission);
  }

  handleGroupSelected(option: DropdownOption) {
    if (!option) return;

    if (this.groupsService.isGroupSelected(option.value)) return;

    this.groupsService.selectGroup(option.value);

    option.permissions?.forEach((permissionId: string) => {
      this.handlePermissionSelection({ id: permissionId, checked: true });
      this.lockedPermissions.add(permissionId);
    });
  }

  removeGroup(groupId: string) {
    const group = this.groupsService.getSelectedGroups()
      .find(g => g.id === groupId);

    if (!group) return;

    group.permissions.forEach(permissionId => {
      this.lockedPermissions.delete(permissionId);
      this.handlePermissionSelection({ id: permissionId, checked: false });
    });

    this.groupsService.unselectGroup(groupId);
  }

  async loadGroups() {
    const groups = await this.groupsService.loadGroups();

    this.groupOptions = groups.map(group => ({
      label: group.title,
      value: group.id,
      permissions: group.permissions
    }));
  }


}
