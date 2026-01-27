// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslationService } from '../../../core/services/i18n/translate.service';
import { RegisterData, RegisterService } from '../../../core/services/auth/register.service';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
@Component({
  selector: 'app-register-step-3',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DefaultStepComponent
  ],
  templateUrl: './register-step-3.component.html',
  styleUrl: './register-step-3.component.scss'
})
export class RegisterStep3Component implements OnInit {

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------
  isLoading = false;
  registrationData: any = {};

  textTyped = '';

  // ------------------------------------------------------
  // TEXTOS (TRADUÇÃO)
  // ------------------------------------------------------
  title = '';
  subtitle = '';
  textExplanation = '';
  placeholderTextArea = '';
  btnLast = '';

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------
  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService
  ) {}

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    this.loadSavedData();
    this.listenLanguageChanges();
  }

  // ------------------------------------------------------
  // DADOS SALVOS
  // ------------------------------------------------------
  private loadSavedData(): void {
    this.registrationData = this.registerService.getData('users');
    this.textTyped = this.registrationData['description'] ?? '';
  }

  // ------------------------------------------------------
  // TRADUÇÕES
  // ------------------------------------------------------
  private listenLanguageChanges(): void {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  private loadTranslations(): void {
    const section = 'Extra_info_page';

    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);
    this.textExplanation = this.translationService.getTranslation('textExplanation', section);
    this.placeholderTextArea = this.translationService.getTranslation('placeholderTextArea', section);
    this.btnLast = this.translationService.getTranslation('btnRegister', section);
  }

  // ------------------------------------------------------
  // SINCRONIZAÇÃO (SERVICE)
  // ------------------------------------------------------
  onFieldChange(field: keyof RegisterData, value: any): void {
    this.registerService.updateData('users', {
      [field]: value
    });
  }

  // ------------------------------------------------------
  // NAVEGAÇÃO
  // ------------------------------------------------------
  return(): void {
    this.registerService.previousStep('users');
  }

  submit(): void {
    this.registerService.nextStep('users');
  }
}
