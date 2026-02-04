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

  //Validators
  msgEmptyName = '';
  msgPasswordMismatch = '';
  msgEmailAlreadyExists = '';
  msgEnrollmentAlreadyExists = '';
  msgPasswordWeak = '';
  msgPasswordContainsEmail = '';
  msgPasswordContainsName = '';
  msgMultiWrong = '';
  msgDoubleWrongJoin = '';
  msgDoubleWrong = '';
  msgErrorField = '';
  msgUnknown = '';

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

  onPhoneChange(value: string): void {
    const formatted = this.formatPhone(value);
    
    this.phone = formatted;

    setTimeout(() => {
      if (this.phone !== formatted) {
        this.phone = formatted;
      }
      this.onFieldChange('phone', formatted);
    });
  }

  private formatPhone(value: string): string {
    if (!value) return '';

    const numbers = value.replace(/\D/g, '').substring(0, 11);
    const len = numbers.length;

    if (len === 0) return '';
    if (len <= 2) return `(${numbers}`;
    if (len <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (len <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }

  onPhonePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';

    const formatted = this.formatPhone(pastedText);
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
    const validators = 'step_1.validators.';

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

    // --- Validators ---
    this.msgEmptyName = this.translationService.getTranslation(validators + 'emptyName', section);
    this.msgPasswordMismatch = this.translationService.getTranslation(validators + 'passwordMismatch', section);
    this.msgEmailAlreadyExists = this.translationService.getTranslation(validators + 'emailAlreadyExists', section);
    this.msgEnrollmentAlreadyExists = this.translationService.getTranslation(validators + 'enrollmentAlreadyExists', section);
    this.msgPasswordWeak = this.translationService.getTranslation(validators + 'passwordWeak', section);
    this.msgPasswordContainsEmail = this.translationService.getTranslation(validators + 'passwordContainsEmail', section);
    this.msgPasswordContainsName = this.translationService.getTranslation(validators + 'passwordContainsName', section);
    this.msgMultiWrong = this.translationService.getTranslation(validators + 'msgMultiWrong', section);
    this.msgDoubleWrongJoin = this.translationService.getTranslation(validators + 'msgDoubleWrongJoin', section);
    this.msgDoubleWrong = this.translationService.getTranslation(validators + 'msgDoubleWrong', section);
    this.msgErrorField = this.translationService.getTranslation(validators + 'msgErrorField', section);
    this.msgUnknown = this.translationService.getTranslation(validators + 'msgUnknown', section);
  }

  // ------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------
  private async validateForm(): Promise<boolean> {

    const ERROR_FIELD_MAP: Record<string, string> = {
      //NAME
      EMPTY_NAME: this.titleName,
      INVALID_NAME: this.titleName,
      INVALID_NAME_PART: this.titleName,
      //EMAIL
      EMPTY_EMAIL: this.titleName,
      INVALID_EMAIL: this.titleEmail,
      EMAIL_ALREADY_EXISTS: this.titleEmail,
      //PHONE
      EMPTY_PHONE: this.titlePhone,
      INVALID_PHONE: this.titlePhone,
      //ENROLLMENT
      EMPTY_ENROLLMENT: this.titleEnrollment,
      //PASSWORD
      EMPTY_PASSWORD: this.titlePassword,
      PASSWORD_TOO_SHORT: this.titlePassword,
      PASSWORD_WEAK: this.titlePassword,
      PASSWORD_CONTAINS_EMAIL: this.titlePassword,
      PASSWORD_CONTAINS_NAME: this.titlePassword,
      //CONFIRMPASSWORD
      EMPTY_CONFIRMPASSWORD: this.titleConfirmPassword,
      PASSWORD_MISMATCH: this.titleConfirmPassword
    };

    const ERROR_MESSAGE_MAP: Record<string, string> = {
      EMPTY_NAME: this.msgEmptyName,
      PASSWORD_MISMATCH: this.msgPasswordMismatch,
      EMAIL_ALREADY_EXISTS: this.msgEmailAlreadyExists,
      ENROLLMENT_ALREADY_EXISTS: this.msgEnrollmentAlreadyExists,
      PASSWORD_WEAK: this.msgPasswordWeak,
      PASSWORD_CONTAINS_EMAIL: this.msgPasswordContainsEmail,
      PASSWORD_CONTAINS_NAME: this.msgPasswordContainsName
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
    const fieldErrors = errors.filter(e => ERROR_FIELD_MAP[e.error!]);

    // ======================================================
    // MOSTRA ERROS DE CAMPO (um bloco de toast)
    // ======================================================
    let message = '';

    if (fieldErrors.length > 2) {
      message = this.msgMultiWrong;
    } else if (fieldErrors.length === 2) {
      const fields = fieldErrors.map(e => ERROR_FIELD_MAP[e.error!]);
      message = `${fields.join(this.msgDoubleWrongJoin)}${this.msgDoubleWrong}`;
    } else if (fieldErrors.length === 1 || specialErrors.length > 0) {
      if (specialErrors.length) {
        for (const error of specialErrors) {
          const message = ERROR_MESSAGE_MAP[error.error!];
          if (message) {
            this.toastService.clear();
            this.toastService.error(message);
            return false;
          }
        }
      }
      message = `${this.msgErrorField}${ERROR_FIELD_MAP[fieldErrors[0].error!] ?? this.msgUnknown}`;
    }

    if (errors.length > 0) {
      this.toastService.clear();
      this.toastService.error(message);
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
    //if (!(await this.validateForm())) return;
    //NÃO ESQUEÇA DE ATIVAR!!!
    //NÃO ESQUEÇA DE ATIVAR!!!

    this.registerService.nextStep('users');
  }
}
