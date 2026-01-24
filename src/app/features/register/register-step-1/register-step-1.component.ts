// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PrimaryInputComponent } from '../../../shared/components/primary-input/primary-input.component';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';

import { TranslationService } from '../../../core/services/translate.service';
import { RegisterData, RegisterService } from '../../../core/services/register.service';
import { ToastrService } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';


// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
@Component({
  selector: 'app-register-step-1',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimaryInputComponent,
    DefaultStepComponent,
    MatTooltipModule
  ],
  templateUrl: './register-step-1.component.html',
  styleUrl: './register-step-1.component.scss'
})
export class RegisterStep1Component implements OnInit {

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------
  name = '';
  email = '';
  phone = '';
  enrollment = '';
  password = '';
  confirmPassword = '';

  title = '';
  subtitle = '';
  stepOne = '';
  stepTwo = '';
  stepThree = '';

  titleName = '';
  placeholderName = '';
  titleEmail = '';
  placeholderEmail = '';
  titlePhone = '';
  placeholderPhone = '';
  titleEnrollment = '';
  placeholderEnrollment = '';
  titlePassword = '';
  placeholderPassword = '';
  titleConfirmPassword = '';
  placeholderConfirmPassword = '';

  btnLast = '';
  tooltipEnrollment = '';

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------
  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private toastService: ToastrService
  ) {}

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    this.loadSavedData();
    this.listenLanguageChanges();
  }

  // ------------------------------------------------------
  // DATA
  // ------------------------------------------------------
  private loadSavedData(): void {
    const data = this.registerService.getData();
    if (!data) return;

    this.name = data.name ?? '';
    this.email = data.email ?? '';
    this.phone = data.phone ?? '';
    this.enrollment = data.enrollment ?? '';
    this.password = data.password ?? '';
    this.confirmPassword = data['confirmPassword'] ?? '';
  }

  onFieldChange(field: keyof RegisterData, value: any): void {
    this.registerService.updateData({
      [field]: value
    });
  }

  // ------------------------------------------------------
  // TRANSLATIONS
  // ------------------------------------------------------
  private listenLanguageChanges(): void {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  private loadTranslations(): void {
    const section = 'Register_Page';

    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);

    this.stepOne = this.translationService.getTranslation('stepOne', section);
    this.stepTwo = this.translationService.getTranslation('stepTwo', section);
    this.stepThree = this.translationService.getTranslation('stepThree', section);

    this.titleName = this.translationService.getTranslation('titleName', section);
    this.placeholderName = this.translationService.getTranslation('inputName', section);

    this.titleEmail = this.translationService.getTranslation('titleEmail', section);
    this.placeholderEmail = this.translationService.getTranslation('inputEmail', section);

    this.titlePhone = this.translationService.getTranslation('titlePhone', section);
    this.placeholderPhone = this.translationService.getTranslation('inputPhone', section);

    this.titleEnrollment = this.translationService.getTranslation('titleEnrollment', section);
    this.placeholderEnrollment = this.translationService.getTranslation('inputEnrollment', section);

    this.titlePassword = this.translationService.getTranslation('titlePassword', section);
    this.placeholderPassword = this.translationService.getTranslation('inputPassword', section);

    this.titleConfirmPassword =
      this.translationService.getTranslation('titleConfirmPassword', section);
    this.placeholderConfirmPassword =
      this.translationService.getTranslation('inputPasswordConfirm', section);

    this.btnLast = this.translationService.getTranslation('btnRegister', section);
    this.tooltipEnrollment =
      this.translationService.getTranslation('tooltipEnrollment', section);
  }

  // ------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------
  private async validateForm(): Promise<boolean> {

    const ERROR_FIELD_MAP: Record<string, string> = {
      INVALID_NAME: this.placeholderName,
      INVALID_EMAIL: this.placeholderEmail,
      INVALID_PHONE: this.placeholderPhone,
      ENROLLMENT_REQUIRED: this.placeholderEnrollment,
      PASSWORD_TOO_SHORT: this.placeholderPassword,
      PASSWORD_MISMATCH: this.placeholderConfirmPassword
    };

    const validations = await Promise.all([
      this.registerService.validate('NAME', this.name),
      this.registerService.validate('EMAIL', this.email),
      this.registerService.validate('PHONE', this.phone),
      this.registerService.validate('ENROLLMENT', this.enrollment),
      this.registerService.validate('PASSWORD', this.password),
      this.registerService.validate('PASSWORD_MATCH', null, {
        password: this.password,
        confirmPassword: this.confirmPassword
      })
    ]);

    const errors = validations.filter(v => !v.valid);

    if (errors.length === 1) {
      const error = errors[0];

      const ERROR_MESSAGE_MAP: Record<string, string> = {
        PASSWORD_MISMATCH: 'As senhas não conferem',
        EMAIL_ALREADY_EXISTS: 'Já existe um Email',
        ENROLLMENT_ALREADY_EXISTS: 'Já existe essa Matrícula'
      };

      const message = ERROR_MESSAGE_MAP[error.error!];
      if (message) this.toastServiceError(message);

      this.toastServiceError(
        `Erro no campo: ${ERROR_FIELD_MAP[error.error!] ?? 'desconhecido'}`
      );
    }

    if (errors.length === 2) {
      const fields = errors.map(e => ERROR_FIELD_MAP[e.error!]);
      this.toastServiceError(
        `Erro nos campos: ${fields.join(' e ')}. Corrija para continuar.`
      );
    }

    if (errors.length >= 3) {
      this.toastServiceError(
        'Existem vários campos inválidos. Revise o formulário.'
      );
    }

    return errors.length === 0;
  }

  toastServiceError(message: string): void {
    this.toastService.clear();
    this.toastService.error(message);
  }

  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  async submit(): Promise<void> {
    if (!(await this.validateForm())) return;
    this.registerService.nextStep();
  }
}
