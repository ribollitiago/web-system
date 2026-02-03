import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../core/services/auth/login.service';
import { ToastrService } from 'ngx-toastr';
import { PrimaryInputComponent } from '../../shared/components/input/primary-input/primary-input.component';
import { DefaultLoginLayoutComponent } from '../../layout/default-login-layout/default-login-layout.component';
import { TranslationService } from '../../core/services/i18n/translate.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    DefaultLoginLayoutComponent,
    PrimaryInputComponent,
    ReactiveFormsModule
  ],
  providers: [LoginService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  showForgotPasswordForm = false;

  title = '';
  subtitle = '';
  btnText = '';
  txtLink = '';
  placeholderEmail = '';
  placeholderPassword = '';

  messages: any = {};

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toast: ToastrService,
    private translate: TranslationService
  ) { }

  ngOnInit(): void {
    this.createForms();
    this.translate.language$.subscribe(() => this.loadTranslations());

    this.checkLogoutReason();
  }


  // =========================
  // FORMULÁRIOS
  // =========================

  private createForms(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });

    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  // =========================
  // TRADUÇÕES
  // =========================

  private loadTranslations(): void {
    const section = 'login_form';
    const errors = this.translate.getTranslation('LoginErrors', 'Exceptions');

    this.messages = errors;

    this.updateTexts(section);
  }

  private updateTexts(section: string): void {
    const isForgot = this.showForgotPasswordForm;

    this.title = this.translate.getTranslation(isForgot ? 'titleFgt' : 'titleLgn', section);
    this.subtitle = this.translate.getTranslation(isForgot ? 'subtitleFgt' : 'subtitleLgn', section);
    this.btnText = this.translate.getTranslation(isForgot ? 'btnLoginFgt' : 'btnLoginLgn', section);
    this.txtLink = this.translate.getTranslation(
      isForgot ? 'linkForgotPasswordFgt' : 'linkForgotPasswordLgn',
      section
    );

    this.placeholderEmail = this.translate.getTranslation('inputEmailLgn', section);
    this.placeholderPassword = this.translate.getTranslation('inputPasswordLgn', section);
  }

  // =========================
  // SUBMIT
  // =========================

  submit(): void {
    this.showForgotPasswordForm
      ? this.submitForgotPassword()
      : this.submitLogin();
  }

  private submitLogin(): void {
    if (this.loginForm.invalid) {
      this.toast.error(this.messages.loginInvalid);
      return;
    }

    const { email, password } = this.loginForm.value;

    this.loginService.login(email, password).subscribe({
      next: user => {
        if (user) {
          this.toast.success(this.messages.loginSucess);
          this.router.navigate(['home']);
        }
      },
      error: err => this.handleAuthError(err)
    });
  }

  private submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.toast.error(this.messages.loginEmailRecoveryInvalid);
      return;
    }

    const { email } = this.forgotPasswordForm.value;

    this.loginService.recoverPassword(email).subscribe({
      next: () => this.toast.success(this.messages.loginEmailRecovery),
      error: err => this.handleAuthError(err, true)
    });
  }

  // =========================
  // ERROS CENTRALIZADOS
  // =========================

  private handleAuthError(error: any, isRecovery = false): void {
    const code = error?.code || error?.error;

    switch (code) {
      case 'auth/user-not-found':
        this.toast.error(this.messages.loginInvalid);
        break;

      case 'auth/wrong-password':
        this.toast.error(this.messages.loginInvalid);
        break;

      case 'auth/user-disabled':
        this.toast.error(this.messages.loginBlockedUser);
        break;

      case 'auth/invalid-email':
        this.toast.error(
          isRecovery
            ? this.messages.loginEmailRecoveryInvalid
            : this.messages.loginInvalid
        );
        break;

      default:
        this.toast.error(
          isRecovery
            ? this.messages.loginEmailRecoveryError
            : this.messages.loginError
        );
    }
  }

  private checkLogoutReason(): void {
    const reason = sessionStorage.getItem('logout-reason');

    if (!reason) return;

    if (reason === 'TIMEOUT') {
      this.toast.warning(
        this.messages.sessionTimeout ||
        'Sua sessão expirou por inatividade.'
      );
    }

    if (reason === 'MAX_SESSION') {
      this.toast.warning(
        this.messages.sessionMaxTime ||
        'Sua sessão expirou por tempo máximo de uso.'
      );
    }

    sessionStorage.removeItem('logout-reason');
  }


  // =========================
  // TOGGLE FORM
  // =========================

  navigate(): void {
    this.showForgotPasswordForm = !this.showForgotPasswordForm;
    this.updateTexts('login_form');
  }
}
