import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrimaryInputComponent } from '../../../components/primary-input/primary-input.component';
import { TranslationService } from '../../../services/translate.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryInputComponent,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;

  // Translation variables
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
  titleDocument: string = '';
  placeholderDocument: string = '';
  titlePassword: string = '';
  placeholderPassword: string = '';
  titleConfirmPassword: string = '';
  placeholderConfirmPassword: string = '';
  btnRegister: string = '';

  constructor(
    private translationService: TranslationService,
    private router: Router
  ) {
    this.registerForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\+?[1-9]\d{1,14}$/) // Basic phone validation
      ]),
      document: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/) // CPF pattern
      ]),
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
    this.titleDocument = this.translationService.getTranslation('titleDocument', section);
    this.placeholderDocument = this.translationService.getTranslation('inputDocument', section);
    this.titlePassword = this.translationService.getTranslation('titlePassword', section);
    this.placeholderPassword = this.translationService.getTranslation('inputPassword', section);
    this.titleConfirmPassword = this.translationService.getTranslation('titleConfirmPassword', section);
    this.placeholderConfirmPassword = this.translationService.getTranslation('inputPasswordConfirm', section);
    this.btnRegister = this.translationService.getTranslation('btnRegister', section);
  }

  submit() {
    if (this.registerForm.valid) {
      // Handle form submission
      console.log('Form values:', this.registerForm.value);
      // Add your registration logic here
    } else {
      // Handle form errors
      console.log('Form has errors:', this.registerForm.errors);
    }
  }
}
