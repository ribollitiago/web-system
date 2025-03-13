import { Component } from '@angular/core';
import { TranslationService } from '../../../../services/translate.service';
import { RegisterService } from '../../../../services/register.service';
import { Router } from '@angular/router';
import { SearchInputComponent } from '../../../../components/search-input/search-input.component';
import { CommonModule } from '@angular/common';
import { StepsFilterComponent } from "../../../../components/register/steps-filter/steps-filter.component";

@Component({
  selector: 'app-register-step-2',
  imports: [
    SearchInputComponent,
    SearchInputComponent,
    CommonModule,
    StepsFilterComponent
],
  templateUrl: './register-step-2.component.html',
  styleUrl: './register-step-2.component.scss',
})
export class RegisterStep2Component {
  selectedButton: string = 'users';

  currentSearchQuery: string = '';

  title: string = '';
  subtitle: string = '';
  stepOne: string = '';
  stepTwo: string = '';
  stepThree: string = '';
  btnRegister: string = '';
  inputSearch: string = '';
  filterOne: string = '';
  filterTwo: string = '';
  filterThree: string = '';

  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private router: Router
  ) {}

  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
  }

  loadTranslations() {
    const section = 'Permissions_Page';
    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);
    this.inputSearch = this.translationService.getTranslation(
      'inputSearch',
      section
    );
    this.filterOne = this.translationService.getTranslation(
      'filterOne',
      section
    );
    this.filterTwo = this.translationService.getTranslation(
      'filterTwo',
      section
    );
    this.filterThree = this.translationService.getTranslation(
      'filterThree',
      section
    );

    const section2 = 'Register_Page';
    this.stepOne = this.translationService.getTranslation('stepOne', section2);
    this.stepTwo = this.translationService.getTranslation('stepTwo', section2);
    this.stepThree = this.translationService.getTranslation(
      'stepThree',
      section2
    );
    this.btnRegister = this.translationService.getTranslation(
      'btnRegister',
      section2
    );
  }

  selectButton(buttonName: string) {
    this.selectedButton = buttonName;
  }

  async submit() {
    this.registerService.setCurrentStep(3);
  }
  async return() {
    this.registerService.setCurrentStep(1);
  }

  handleSearchChange(query: string) {
    this.currentSearchQuery = query;
  }
}
