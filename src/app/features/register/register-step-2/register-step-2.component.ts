import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/translate.service';
import { RegisterService } from '../../../core/services/register.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { CommonModule } from '@angular/common';
import { StepsFilterComponent } from '../steps-filter/steps-filter.component';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';

@Component({
  selector: 'app-register-step-2',
  imports: [
    SearchInputComponent,
    CommonModule,
    StepsFilterComponent,
    DefaultStepComponent
  ],
  templateUrl: './register-step-2.component.html',
  styleUrl: './register-step-2.component.scss',
})
export class RegisterStep2Component implements OnDestroy {
  selectedButton: string = 'users';
  currentSearchQuery: string = '';
  title: string = '';
  subtitle: string = '';
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
}
