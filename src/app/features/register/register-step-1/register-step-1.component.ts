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
    const section = 'register_page';
    const step1 = 'step_1.';
    const default_ = 'default.'

    // --- Cabeçalho (Step 1) ---
    this.title = this.translationService.getTranslation(step1 + 'title', section);
    this.subtitle = this.translationService.getTranslation(step1 + 'subtitle', section);

    // --- Navegação (Defaults) ---
    this.stepOne = this.translationService.getTranslation(default_ + 'stepOne', section);
    this.stepTwo = this.translationService.getTranslation(default_ + 'stepTwo', section);
    this.stepThree = this.translationService.getTranslation(default_ + 'stepThree', section);

    // --- Campos: Nome ---
    this.titleName = this.translationService.getTranslation(step1 + 'titleName', section);
    this.placeholderName = this.translationService.getTranslation(step1 + 'inputName', section);

    // --- Campos: Email ---
    this.titleEmail = this.translationService.getTranslation(step1 + 'titleEmail', section);
    this.placeholderEmail = this.translationService.getTranslation(step1 + 'inputEmail', section);

    // --- Campos: Telefone ---
    this.titlePhone = this.translationService.getTranslation(step1 + 'titlePhone', section);
    this.placeholderPhone = this.translationService.getTranslation(step1 + 'inputPhone', section);

    // --- Campos: Matrícula ---
    this.titleEnrollment = this.translationService.getTranslation(step1 + 'titleEnrollment', section);
    this.placeholderEnrollment = this.translationService.getTranslation(step1 + 'inputEnrollment', section);
    this.tooltipEnrollment = this.translationService.getTranslation(step1 + 'tooltipEnrollment', section);

    // --- Campos: Senha ---
    this.titlePassword = this.translationService.getTranslation(step1 + 'titlePassword', section);
    this.placeholderPassword = this.translationService.getTranslation(step1 + 'inputPassword', section);

    // --- Campos: Confirmar Senha ---
    this.titleConfirmPassword = this.translationService.getTranslation(step1 + 'titleConfirmPassword', section);
    this.placeholderConfirmPassword = this.translationService.getTranslation(step1 + 'inputPasswordConfirm', section);

    // --- Botão de Ação (Defaults) ---
    this.btnLast = this.translationService.getTranslation(default_ + 'btnRegister', section);
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
      EMPTY_NAME: 'Campo NOME vazio.',
      PASSWORD_MISMATCH: 'SENHAS não conferem.',
      EMAIL_ALREADY_EXISTS: 'EMAIL já existente.',
      ENROLLMENT_ALREADY_EXISTS: 'MATRICULA já cadastrada.',
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
    let message = '';

    if (fieldErrors.length > 2) {
      message = 'Existem vários campos inválidos. Revise o formulário.';
    } else if (fieldErrors.length === 2) {
      const fields = fieldErrors.map(e => ERROR_FIELD_MAP[e.error!]);
      message = `Erro nos campos: ${fields.join(' e ')}. Corrija para continuar.`;
    } else if (fieldErrors.length === 1) {
      message = `Erro no campo: ${ERROR_FIELD_MAP[fieldErrors[0].error!] ?? 'desconhecido'}`;
    } else if (specialErrors.length > 0) {
      for (const error of specialErrors) {
        const message = ERROR_MESSAGE_MAP[error.error!];
        if (message) {
          this.toastService.clear();
          this.toastService.error(message);
          return false;
        }
      }

    }

    this.toastService.clear();
    this.toastService.error(message);

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
