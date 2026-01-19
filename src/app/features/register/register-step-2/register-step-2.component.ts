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
  groupOptions: DropdownOption[] = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Visualizador', value: 'viewer' },
    { label: 'Editor', value: 'editor' },
    { label: 'Editor', value: 'a' },
    { label: 'Editor', value: 's' },
    { label: 'Editor', value: 'd' },
    { label: 'Editor', value: '3' },
    { label: 'Editor', value: 't' },
    { label: 'Editor', value: '5' },
  ];
  selectedGroups: DropdownOption[] = [];

  separatorKeysCodes: number[] = [13, 188];
  itemCtrl = new FormControl('');
  filteredItems: Observable<string[]>;
  selectedItems: string[] = ['Item Genérico 1'];
  allItems: string[] = ['Item Genérico 1', 'Item Genérico 2', 'Item Genérico 3', 'Maçã', 'Banana', 'Laranja'];

  @ViewChild('itemInput') itemInput!: ElementRef<HTMLInputElement>;

  permissionsTitle: string = 'Selecione as permissões individuais para o usuário';
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
    const allSelected = Object.entries(this.permissionsService.getSelectedPermissions())
      .filter(([_, checked]) => checked)
      .map(([id]) => id);

    const allPermissions = allSelected.reduce<{ [key: string]: boolean }>((acc, permission) => {
      acc[permission] = true;
      return acc;
    }, {});

    await this.registerService.setStepData(2, { permissions: allPermissions });
  }

  handleSearchChange(query: string): void {
    this.currentSearchQuery = query;
  }

  handlePermissionSelection(selectedPermissions: string[]): void {
    console.log('Permissões selecionadas:', selectedPermissions);
  }

  handleGroupSelected(option: DropdownOption) {
    if (!option) return;
    const alreadyExists = this.selectedGroups.some(g => g.value === option.value);

    if (!alreadyExists) {
      this.selectedGroups.push(option);
    }
  }

  removeGroup(value: any) {
    const index = this.selectedGroups.findIndex(g => g.value === value);
    if (index >= 0) {
      this.selectedGroups.splice(index, 1);
    }
  }
}
