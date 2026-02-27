// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PrimaryInputComponent } from '../../../shared/components/input/primary-input/primary-input.component';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';

import { RegisterData, RegisterService } from '../../../core/services/auth/register.service';
import { ToastrService } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslationService } from '../../../core/services/shared/translate.service';
import { ValidatorsService } from '../../../core/services/shared/validators.service';

// ------------------------------------------------------
// TYPES / INTERFACES
// ------------------------------------------------------
type FieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'enrollment'
  | 'password'
  | 'confirmPassword';

interface FieldErrorState {
  errorCode: string;
  message: string;
}

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
  msgInvalidName = '';
  msgInvalidLastName = '';
  msgEmptyEmail = '';
  msgInvalidEmail = '';
  msgEmptyPhone = '';
  msgPhoneTooShort = '';
  msgEmptyEnrollment = '';
  msgEmptyPassword = '';
  msgEmptyConfirmPassword = '';
  msgPasswordMismatch = '';
  msgEmailAlreadyExists = '';
  msgEnrollmentAlreadyExists = '';
  msgPasswordWeak = '';
  msgPasswordTooShort = '';
  msgPasswordContainsEmail = '';
  msgPasswordContainsName = '';
  msgMultiWrong = '';
  msgDoubleWrongJoin = '';
  msgDoubleWrong = '';
  msgErrorField = '';
  msgUnknown = '';

  // ------------------------------------------------------
  // FIELD ERRORS (VALIDATION STATE)
  // ------------------------------------------------------
  fieldErrors: Partial<Record<FieldKey, FieldErrorState>> = {};
  focusedField: FieldKey | null = null;
  errorAnimationFields: Set<FieldKey> = new Set();

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
    this.msgInvalidName = this.translationService.getTranslation(validators + 'invalidName', section);
    this.msgInvalidLastName = this.translationService.getTranslation(validators + 'invalidLastName', section);
    this.msgEmptyEmail = this.translationService.getTranslation(validators + 'emptyEmail', section);
    this.msgInvalidEmail = this.translationService.getTranslation(validators + 'invalidEmail', section);
    this.msgEmptyPhone = this.translationService.getTranslation(validators + 'emptyPhone', section);
    this.msgPhoneTooShort = this.translationService.getTranslation(validators + 'phoneTooShort', section);
    this.msgEmptyEnrollment = this.translationService.getTranslation(validators + 'emptyEnrollment', section);
    this.msgEmptyPassword = this.translationService.getTranslation(validators + 'emptyPassword', section);
    this.msgEmptyConfirmPassword = this.translationService.getTranslation(validators + 'emptyConfirmPassword', section);
    this.msgPasswordMismatch = this.translationService.getTranslation(validators + 'passwordMismatch', section);
    this.msgEmailAlreadyExists = this.translationService.getTranslation(validators + 'emailAlreadyExists', section);
    this.msgEnrollmentAlreadyExists = this.translationService.getTranslation(validators + 'enrollmentAlreadyExists', section);
    this.msgPasswordTooShort = this.translationService.getTranslation(validators + 'passwordTooShort', section);
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

    // ------------------------------------------------------
    // MAPA DE MENSAGENS DE ERRO (ORGANIZADO POR CAMPO)
    // ------------------------------------------------------
    const ERROR_MESSAGE_MAP: Record<string, { field: FieldKey; message: string }> = {

      // ---------------- NAME ----------------
      EMPTY_NAME: {
        field: 'name',
        message: this.msgEmptyName
      },
      INVALID_NAME: {
        field: 'name',
        message: this.msgInvalidName
      },
      INVALID_NAME_PART: {
        field: 'name',
        message: this.msgInvalidLastName
      },

      // ---------------- EMAIL ----------------
      EMPTY_EMAIL: {
        field: 'email',
        message: this.msgEmptyEmail
      },
      INVALID_EMAIL: {
        field: 'email',
        message: this.msgInvalidEmail
      },
      EMAIL_ALREADY_EXISTS: {
        field: 'email',
        message: this.msgEmailAlreadyExists
      },

      // ---------------- PHONE ----------------
      EMPTY_PHONE: {
        field: 'phone',
        message: this.msgEmptyPhone
      },
      PHONE_TOO_SHORT: {
        field: 'phone',
        message: this.msgPhoneTooShort
      },

      // ---------------- ENROLLMENT ----------------
      EMPTY_ENROLLMENT: {
        field: 'enrollment',
        message: this.msgEmptyEnrollment
      },
      ENROLLMENT_ALREADY_EXISTS: {
        field: 'enrollment',
        message: this.msgEnrollmentAlreadyExists
      },

      // ---------------- PASSWORD ----------------
      EMPTY_PASSWORD: {
        field: 'password',
        message: this.msgEmptyPassword
      },
      PASSWORD_TOO_SHORT: {
        field: 'password',
        message: this.msgPasswordTooShort
      },
      PASSWORD_WEAK: {
        field: 'password',
        message: this.msgPasswordWeak
      },
      PASSWORD_CONTAINS_EMAIL: {
        field: 'password',
        message: this.msgPasswordContainsEmail
      },
      PASSWORD_CONTAINS_NAME: {
        field: 'password',
        message: this.msgPasswordContainsName
      },

      // ---------------- CONFIRM PASSWORD ----------------
      EMPTY_CONFIRMPASSWORD: {
        field: 'confirmPassword',
        message: this.msgEmptyConfirmPassword
      },
      PASSWORD_MISMATCH: {
        field: 'confirmPassword',
        message: this.msgPasswordMismatch
      }
    };

    // ------------------------------------------------------
    // EXECUTA VALIDAÇÕES
    // ------------------------------------------------------
    const validations = await Promise.all([
      this.validatorsService.validate('NAME', this.name),
      this.validatorsService.validate('EMAIL', this.email),
      this.validatorsService.validate('PHONE', this.phone),
      this.validatorsService.validate('ENROLLMENT', this.enrollment),
      this.validatorsService.validate('PASSWORD', this.password, {
        email: this.email,
        name: this.name
      }),
      this.validatorsService.validate('PASSWORD_MATCH', null, {
        password: this.password,
        confirmPassword: this.confirmPassword
      })
    ]);

    const errors = validations.filter(v => !v.valid);

    // ------------------------------------------------------
    // LIMPA ERROS ANTIGOS
    // ------------------------------------------------------
    this.fieldErrors = {};

    // ------------------------------------------------------
    // PREENCHE ERROS POR CAMPO
    // ------------------------------------------------------
    for (const error of errors) {
      const mapped = ERROR_MESSAGE_MAP[error.error!];

      if (mapped) {
        this.fieldErrors[mapped.field] = {
          errorCode: error.error!,
          message: mapped.message
        };
        this.triggerErrorAnimation(mapped.field);
      } else {
        console.warn('Erro não mapeado:', error.error);
      }
    }

    // ------------------------------------------------------
    // MOSTRA TOOLTIPS + BLOQUEIA SUBMIT
    // ------------------------------------------------------
    if (errors.length > 0) {
      return false;
    }

    // ------------------------------------------------------
    // FORM OK
    // ------------------------------------------------------
    return true;
  }


  hasError(field: FieldKey): boolean {
    return !!this.fieldErrors[field];
  }

  getErrorMessage(field: FieldKey): string {
    return this.fieldErrors[field]?.message ?? '';
  }

  // ------------------------------------------------------
  // FOCUS TRACKING & ANIMATION
  // ------------------------------------------------------
  onFieldFocus(field: FieldKey): void {
    this.focusedField = field;
  }

  onFieldBlur(): void {
    this.focusedField = null;
  }

  shouldAnimateError(field: FieldKey): boolean {
    return this.errorAnimationFields.has(field);
  }

  private triggerErrorAnimation(field: FieldKey): void {
    this.errorAnimationFields.add(field);

    // Remove animação após 600ms para possibilitar re-trigger
    setTimeout(() => {
      this.errorAnimationFields.delete(field);
    }, 600);
  }

  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  async submit(): Promise<void> {

    //NÃO ESQUEÇA DE ATIVAR!!!
    //NÃO ESQUEÇA DE ATIVAR!!!
    // if (!(await this.validateForm())) return;
    //NÃO ESQUEÇA DE ATIVAR!!!
    //NÃO ESQUEÇA DE ATIVAR!!!

    this.registerService.nextStep('users');
  }
}



