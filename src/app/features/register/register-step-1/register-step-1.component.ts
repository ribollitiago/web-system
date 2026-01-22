// ------------------------------------------------------
// IMPORTS – Angular Core
// ------------------------------------------------------
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';

// ------------------------------------------------------
// IMPORTS – Components
// ------------------------------------------------------
import { PrimaryInputComponent } from '../../../shared/components/primary-input/primary-input.component';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';

// ------------------------------------------------------
// IMPORTS – Services
// ------------------------------------------------------
import { TranslationService } from '../../../core/services/translate.service';
import { RegisterService } from '../../../core/services/register.service';
import { ToastrService } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';

// ------------------------------------------------------
// COMPONENT METADATA
// ------------------------------------------------------
@Component({
  selector: 'app-register-step-1',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PrimaryInputComponent,
    DefaultStepComponent,
    MatTooltipModule
  ],
  templateUrl: './register-step-1.component.html',
  styleUrl: './register-step-1.component.scss'
})
export class RegisterStep1Component {

  // ------------------------------------------------------
  // FORMULÁRIO
  // ------------------------------------------------------
  registerForm: FormGroup;

  // ------------------------------------------------------
  // TEXTOS (TRADUÇÃO)
  // ------------------------------------------------------
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
  ) {
    // ------------------------------------------------------
    // INICIALIZAÇÃO DO FORMULÁRIO
    // ------------------------------------------------------
    this.registerForm = new FormGroup(
      {
        name: new FormControl('', [
          Validators.required,
          fullNameValidator()
        ]),

        email: new FormControl('', [
          Validators.required,
          Validators.email
        ]),

        phone: new FormControl('', [
          Validators.required,
          Validators.pattern(/^\+?[1-9]\d{1,14}$/)
        ]),

        enrollment: new FormControl('', [
          Validators.required
        ]),

        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6)
        ]),

        confirmPassword: new FormControl('', [
          Validators.required
        ])
      },
      {
        validators: this.passwordMatchValidator as ValidatorFn
      }
    );
  }

  // ------------------------------------------------------
  // LIFECYCLE – ON INIT
  // ------------------------------------------------------
  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  // ------------------------------------------------------
  // VALIDADOR – CONFIRMAÇÃO DE SENHA
  // ------------------------------------------------------
  passwordMatchValidator(control: AbstractControl) {
    const form = control as FormGroup;

    return form.get('password')?.value ===
      form.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  // ------------------------------------------------------
  // TRADUÇÕES
  // ------------------------------------------------------
  loadTranslations() {
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

    this.titleConfirmPassword = this.translationService.getTranslation('titleConfirmPassword', section);
    this.placeholderConfirmPassword = this.translationService.getTranslation('inputPasswordConfirm', section);

    this.btnLast = this.translationService.getTranslation('btnRegister', section);

    this.tooltipEnrollment = this.translationService.getTranslation('tooltipEnrollment', section);
  }

  // ------------------------------------------------------
  // VALIDAÇÃO CENTRALIZADA DO FORMULÁRIO
  // ------------------------------------------------------
  private validateForm(): boolean {
    const form = this.registerForm;
    const errors: string[] = [];

    const validations = [
      {
        invalid: form.get('name')?.hasError('required') ||
          form.get('name')?.hasError('fullName'),
        message: 'Informe o nome completo'
      },
      {
        invalid: form.get('email')?.invalid,
        message: 'Informe um email válido'
      },
      {
        invalid: form.get('phone')?.invalid,
        message: 'Informe um número de telefone válido'
      },
      {
        invalid: form.get('enrollment')?.invalid,
        message: 'Informe a matrícula'
      },
      {
        invalid: form.get('password')?.hasError('minlength'),
        message: 'A senha deve ter no mínimo 6 caracteres'
      },
      {
        invalid: form.hasError('mismatch'),
        message: 'As senhas não coincidem'
      }
    ];

    validations.forEach(v => {
      if (v.invalid) {
        errors.push(v.message);
      }
    });

    if (errors.length === 0) return true;

    this.showValidationToast(errors);
    return false;
  }

  // ------------------------------------------------------
  // EXIBIÇÃO DE ERROS (TOAST)
  // ------------------------------------------------------
  private showValidationToast(errors: string[]): void {
    if (errors.length === 1) {
      this.toastService.error(errors[0]);
      return;
    }

    if (errors.length === 2) {
      this.toastService.error(`${errors[0]} e ${errors[1]}.`);
      return;
    }

    this.toastService.error(
      'Existem vários campos inválidos. Verifique os dados informados.'
    );
  }

  // ------------------------------------------------------
  // SUBMIT DO FORMULÁRIO
  // ------------------------------------------------------
  async submit() {
    if (!this.validateForm()) return;

    await this.registerService.setStepData(1, this.registerForm.value);
  }
}

// ------------------------------------------------------
// VALIDADOR – NOME COMPLETO
// ------------------------------------------------------
export function fullNameValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = control.value?.trim();

    if (!value) return null;

    const parts = value.split(' ');
    return parts.length >= 2 ? null : { fullName: true };
  };
}
