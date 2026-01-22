import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrimaryInputComponent } from '../../../shared/components/primary-input/primary-input.component';
import { TranslationService } from '../../../core/services/translate.service';
import { RegisterService } from '../../../core/services/register.service';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register-step-1',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryInputComponent,
    ReactiveFormsModule,
    DefaultStepComponent
  ],
  templateUrl: './register-step-1.component.html',
  styleUrl: './register-step-1.component.scss'
})
export class RegisterStep1Component {
  registerForm: FormGroup;

  title: string = '';
  subtitle: string = '';
  stepOne: string = '';
  stepTwo: string = '';
  stepThree: string = '';
  titleName: string = '';
  placeholderName: string = '';
  titleEmail: string = '';
  placeholderEmail: string = '';
  titlePhone: string = '';
  placeholderPhone: string = '';
  titleEnrollment: string = '';
  placeholderEnrollment: string = '';
  titlePassword: string = '';
  placeholderPassword: string = '';
  titleConfirmPassword: string = '';
  placeholderConfirmPassword: string = '';
  btnLast: string = '';

  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private toastService: ToastrService,
  ) {
    this.registerForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\+?[1-9]\d{1,14}$/) // Basic phone validation
      ]),
      enrollment: new FormControl('', [Validators.required]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]),
      confirmPassword: new FormControl('', [Validators.required])
    }, { validators: this.passwordMatchValidator as ValidatorFn });
  }

  passwordMatchValidator(control: AbstractControl) {
    const form = control as FormGroup;
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
  }

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
  }

  async submit() {
    await this.registerService.setStepData(1, this.registerForm.value);
  }
}
