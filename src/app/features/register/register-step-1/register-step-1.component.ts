// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PrimaryInputComponent } from '../../../shared/components/input/primary-input/primary-input.component';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';

import { TranslationService } from '../../../core/services/i18n/translate.service';
import { RegisterData, RegisterService } from '../../../core/services/auth/register.service';
import { ToastrService } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ValidatorsService } from '../../../core/services/validators/validators.service';


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
    private validatorsService: ValidatorsService,
    private toastService: ToastrService
  ) { }

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    this.registerService.data$.subscribe(allData => {
      const data = allData['users'] || {};
      this.name = data['name'] ?? '';
      this.email = data['email'] ?? '';
      this.phone = data['phone'] ?? '';
      this.enrollment = data['enrollment'] ?? '';
      this.password = data['password'] ?? '';
      this.confirmPassword = data['confirmPassword'] ?? '';
    });

    this.listenLanguageChanges();
  }

  // ------------------------------------------------------
  // DATA
  // ------------------------------------------------------
  onFieldChange(field: keyof RegisterData, value: any): void {
    this.registerService.updateData('users', {
      [field]: value
    });
  }

  private formatPhone(value: string): string {
    const numbers = value.replace(/\D/g, '');

    if (!numbers) return '';

    if (numbers.length <= 2) {
      return `(${numbers}`;
    }

    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }

    return numbers;
  }

  onPhoneChange(value: string): void {
    const formatted = this.formatPhone(value);
    this.phone = formatted;

    this.onFieldChange('phone', formatted);
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
      INVALID_NAME: this.titleName,
      INVALID_NAME_PART: this.titleName,
      INVALID_EMAIL: this.titleEmail,
      INVALID_PHONE: this.titlePhone,
      ENROLLMENT_REQUIRED: this.titleEnrollment,
      PASSWORD_TOO_SHORT: this.titlePassword,
      PASSWORD_MISMATCH: this.titleConfirmPassword
    };

    const ERROR_MESSAGE_MAP: Record<string, string> = {
      INVALID_NAME_CHARACTERS: 'Nome não pode ter caracteres especiais ou numeros',
      PASSWORD_MISMATCH: 'As senhas não conferem',
      EMAIL_ALREADY_EXISTS: 'Já existe esse Email',
      ENROLLMENT_ALREADY_EXISTS: 'Já existe essa Matrícula',
      PASSWORD_WEAK: 'A senha está muito fraca, precisa de uma caractere',
      PASSWORD_CONTAINS_EMAIL: 'A senha está muito fraca, nao pode conter seu email',
      PASSWORD_CONTAINS_NAME: 'A senha está muito fraca, não pode conter seu nome'
    };

    const validations = await Promise.all([
      this.validatorsService.validate('NAME', this.name),
      this.validatorsService.validate('EMAIL', this.email),
      this.validatorsService.validate('PHONE', this.phone),
      this.validatorsService.validate('ENROLLMENT', this.enrollment),
      this.validatorsService.validate('PASSWORD', this.password),
      this.validatorsService.validate('PASSWORD_MATCH', null, {
        password: this.password,
        confirmPassword: this.confirmPassword
      })
    ]);

    const errors = validations.filter(v => !v.valid);

    // ======================================================
    // SEPARA ERROS ESPECIAIS E ERROS DE CAMPO
    // ======================================================

    const specialErrors = errors.filter(e => ERROR_MESSAGE_MAP[e.error!]);
    const fieldErrors = errors.filter(e => !ERROR_MESSAGE_MAP[e.error!]);

    // ======================================================
    // MOSTRA ERROS DE CAMPO (um bloco de toast)
    // ======================================================
    if (fieldErrors.length > 0) {
      let message = '';

      if (fieldErrors.length === 1) {
        message = `Erro no campo: ${ERROR_FIELD_MAP[fieldErrors[0].error!] ?? 'desconhecido'}`;
      } else if (fieldErrors.length === 2) {
        const fields = fieldErrors.map(e => ERROR_FIELD_MAP[e.error!]);
        message = `Erro nos campos: ${fields.join(' e ')}. Corrija para continuar.`;
      } else {
        message = 'Existem vários campos inválidos. Revise o formulário.';
      }

      this.toastService.clear();
      this.toastService.error(message);
    }

    // ======================================================
    // MOSTRA ERROS ESPECIAIS (outro bloco de toast)
    // ======================================================
    if (specialErrors.length > 0) {
      for (const error of specialErrors) {
        const message = ERROR_MESSAGE_MAP[error.error!];
        if (message) this.toastService.error(message);
      }
    }

    // ======================================================
    // RETORNA SE HOUVE ERROS
    // ======================================================
    return errors.length === 0;
  }

  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  async submit(): Promise<void> {

    //NÃO ESQUEÇA DE ATIVAR!!!
    //NÃO ESQUEÇA DE ATIVAR!!!
    if (!(await this.validateForm())) return;
    //NÃO ESQUEÇA DE ATIVAR!!!
    //NÃO ESQUEÇA DE ATIVAR!!!

    this.registerService.nextStep('users');
  }
}
