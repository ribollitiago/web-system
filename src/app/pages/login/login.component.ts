import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';

import { LoginService } from '../../core/services/auth/login.service';
import { ToastrService } from 'ngx-toastr';
import { PrimaryInputComponent } from '../../shared/components/input/primary-input/primary-input.component';
import { DefaultLoginLayoutComponent } from '../../layout/default-login-layout/default-login-layout.component';
import { TranslationService } from '../../core/services/shared/translate.service';
import { SessionService, SessionEvent } from '../../core/services/session/session.service';

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
export class LoginComponent implements OnInit, OnDestroy {

  // ------------------------------------------------------
  // FORMULÁRIOS
  // ------------------------------------------------------
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  showForgotPasswordForm = false;

  // ------------------------------------------------------
  // TEXTOS / TRANSLATION
  // ------------------------------------------------------
  title = '';
  subtitle = '';
  btnText = '';
  txtLink = '';
  placeholderEmail = '';
  placeholderPassword = '';
  messages: any = {};

  // ------------------------------------------------------
  // SUBSCRIPTIONS
  // ------------------------------------------------------
  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------
  constructor(
    private loginService: LoginService,
    private toast: ToastrService,
    private translate: TranslationService,
    private sessionService: SessionService
  ) { }

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    this.createForms();
    this.loadTranslationsOnLanguageChange();
    this.listenSessionEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ------------------------------------------------------
  // FORMULÁRIOS
  // ------------------------------------------------------
  private createForms(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });

    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  // ------------------------------------------------------
  // TRADUÇÃO
  // ------------------------------------------------------
  private loadTranslationsOnLanguageChange(): void {
    const sub = this.translate.language$.subscribe(() => this.loadTranslations());
    this.subscriptions.push(sub);
  }

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
    this.txtLink = this.translate.getTranslation(isForgot ? 'linkForgotPasswordFgt' : 'linkForgotPasswordLgn', section);
    this.placeholderEmail = this.translate.getTranslation('inputEmailLgn', section);
    this.placeholderPassword = this.translate.getTranslation('inputPasswordLgn', section);
  }

  // ------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------
  submit(): void {
    this.showForgotPasswordForm ? this.submitForgotPassword() : this.submitLogin();
  }

  private submitLogin(): void {
    if (this.loginForm.invalid) {
      this.toast.error(this.messages.loginInvalid);
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loginService.login(email, password).subscribe({
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

  // ------------------------------------------------------
  // ERROS CENTRALIZADOS
  // ------------------------------------------------------
  private handleAuthError(error: any, isRecovery = false): void {
    const code = error?.code || error?.error;

    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        this.toast.error(this.messages.loginInvalid);
        break;

      case 'auth/user-disabled':
        this.toast.error(this.messages.loginBlockedUser);
        break;

      case 'auth/invalid-email':
        this.toast.error(isRecovery ? this.messages.loginEmailRecoveryInvalid : this.messages.loginInvalid);
        break;

      default:
        this.toast.error(isRecovery ? this.messages.loginEmailRecoveryError : this.messages.loginError);
    }
  }

  // ------------------------------------------------------
  // LOGOUT / SESSION EVENTS
  // ------------------------------------------------------

  private listenSessionEvents(): void {
    const sub = this.sessionService.sessionEvents$.subscribe((event: SessionEvent | null) => {

      if (event === null) return;

      this.toast.clear();

      const toastOptions = { timeOut: 5000, progressBar: true, closeButton: true };

      switch (event.type) {
        case 'SUCCESS':
          this.toast.success(
            event.message || this.messages.loginSucess || 'Sessão iniciada com sucesso!',
            undefined,
            toastOptions
          );
          break;

        case 'ERROR':
          this.toast.error(
            event.message || 'Erro ao iniciar a sessão',
            undefined,
            toastOptions
          );
          break;

        case 'LOGOUT':
          this.toast.warning(
            event.reason === 'TIMEOUT'
              ? this.messages.sessionTimeout || 'Sua sessão expirou por inatividade.'
              : this.messages.sessionMaxTime || 'Sua sessão expirou por tempo máximo de uso.',
            undefined,
            toastOptions
          );
          break;
      }
    });

    this.subscriptions.push(sub);
  }

  // ------------------------------------------------------
  // TOGGLE FORM
  // ------------------------------------------------------
  navigate(): void {
    this.showForgotPasswordForm = !this.showForgotPasswordForm;
    this.updateTexts('login_form');
  }
}
