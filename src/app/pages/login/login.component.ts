
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { PrimaryInputComponent } from '../../shared/components/input/primary-input/primary-input.component';
import { DefaultLoginLayoutComponent } from '../../layout/default-login-layout/default-login-layout.component';
import { LoginService } from '../../core/services/auth/login.service';
import { TranslationService } from '../../core/services/shared/translate.service';
import {
  SessionEvent,
  SessionService,
} from '../../core/services/core/session/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    DefaultLoginLayoutComponent,
    PrimaryInputComponent,
    ReactiveFormsModule
],
  providers: [LoginService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
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

  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private loginService: LoginService,
    private toast: ToastrService,
    private translate: TranslationService,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    this.createForms();
    this.loadTranslationsOnLanguageChange();
    this.listenSessionEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForms(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });

    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

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
    this.title = this.translate.getTranslation(
      isForgot ? 'titleFgt' : 'titleLgn',
      section,
    );
    this.subtitle = this.translate.getTranslation(
      isForgot ? 'subtitleFgt' : 'subtitleLgn',
      section,
    );
    this.btnText = this.translate.getTranslation(
      isForgot ? 'btnLoginFgt' : 'btnLoginLgn',
      section,
    );
    this.txtLink = this.translate.getTranslation(
      isForgot ? 'linkForgotPasswordFgt' : 'linkForgotPasswordLgn',
      section,
    );
    this.placeholderEmail = this.translate.getTranslation('inputEmailLgn', section);
    this.placeholderPassword = this.translate.getTranslation(
      'inputPasswordLgn',
      section,
    );
  }

  submit(): void {
    this.showForgotPasswordForm ? this.submitForgotPassword() : this.submitLogin();
  }

  private submitLogin(): void {
    if (this.loginForm.invalid) {
      this.showSingleToast(
        'error',
        'LOGIN_INVALID_FORM',
        this.getMessage(this.messages.loginInvalid, 'Credenciais invalidas.'),
      );
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loginService.login(email, password).subscribe({
      error: (err) => this.handleAuthError(err),
    });
  }

  private submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.showSingleToast(
        'error',
        'RECOVERY_INVALID_FORM',
        this.getMessage(this.messages.loginEmailRecoveryInvalid, 'Email invalido.'),
      );
      return;
    }

    const { email } = this.forgotPasswordForm.value;
    this.loginService.recoverPassword(email).subscribe({
      next: () =>
        this.showSingleToast(
          'success',
          'RECOVERY_SENT',
          this.getMessage(
            this.messages.loginEmailRecovery,
            'Solicitacao de recuperacao enviada.',
          ),
        ),
      error: (err) => this.handleAuthError(err, true),
    });
  }

  private handleAuthError(error: any, isRecovery = false): void {
    if (error?.message === 'PASSWORD_RECOVERY_NOT_AVAILABLE') {
      this.showSingleToast(
        'error',
        'RECOVERY_NOT_AVAILABLE',
        this.messages.loginEmailRecoveryError || 'Funcao indisponivel no momento.',
      );
      return;
    }

    if (error?.status === 401) {
      this.showSingleToast(
        'error',
        'LOGIN_401',
        this.getMessage(this.messages.loginInvalid, 'Credenciais invalidas.'),
      );
      return;
    }

    if (error?.status === 403) {
      const message = this.extractErrorCode(error);
      if (message === 'USER_INVISIBLE') {
        this.showSingleToast(
          'error',
          'LOGIN_USER_INVISIBLE',
          'Seu usuario esta invisivel e sem acesso.',
        );
        return;
      }

      this.showSingleToast(
        'error',
        'LOGIN_USER_BLOCKED',
        this.getMessage(
          this.messages.loginBlockedUser,
          'Sua conta esta bloqueada. Contate o suporte.',
        ),
      );
      return;
    }

    const code = error?.code || error?.error;

    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        this.showSingleToast(
          'error',
          'LOGIN_INVALID_CREDENTIALS',
          this.getMessage(this.messages.loginInvalid, 'Credenciais invalidas.'),
        );
        break;

      case 'auth/user-disabled':
        this.showSingleToast(
          'error',
          'LOGIN_DISABLED',
          this.getMessage(
            this.messages.loginBlockedUser,
            'Sua conta esta bloqueada. Contate o suporte.',
          ),
        );
        break;

      case 'auth/invalid-email':
        this.showSingleToast(
          'error',
          'LOGIN_INVALID_EMAIL',
          this.getMessage(
            isRecovery ? this.messages.loginEmailRecoveryInvalid : this.messages.loginInvalid,
            'Email invalido.',
          ),
        );
        break;

      default:
        this.showSingleToast(
          'error',
          isRecovery ? 'RECOVERY_UNKNOWN' : 'LOGIN_UNKNOWN',
          this.getMessage(
            isRecovery ? this.messages.loginEmailRecoveryError : this.messages.loginError,
            'Erro ao autenticar.',
          ),
        );
    }
  }

  private listenSessionEvents(): void {
    const sub = this.sessionService.sessionEvents$.subscribe(
      (event: SessionEvent | null) => {
        if (event === null) return;

        const toastOptions = {
          timeOut: 5000,
          progressBar: true,
          closeButton: true,
        };

        switch (event.type) {
          case 'SUCCESS':
            this.showSingleToast(
              'success',
              'SESSION_SUCCESS',
              event.message || this.messages.loginSucess || 'Sessao iniciada com sucesso!',
              toastOptions,
            );
            break;

          case 'ERROR':
            this.showSingleToast(
              'error',
              `SESSION_ERROR_${event.message ?? 'GENERIC'}`,
              event.message || 'Erro ao iniciar a sessao',
              toastOptions,
            );
            break;

          case 'LOGOUT':
            this.showSingleToast(
              'warning',
              `SESSION_LOGOUT_${event.reason ?? 'GENERIC'}`,
              this.resolveLogoutMessage(event),
              toastOptions,
            );
            break;
        }
      },
    );

    this.subscriptions.push(sub);
  }

  navigate(): void {
    this.showForgotPasswordForm = !this.showForgotPasswordForm;
    this.updateTexts('login_form');
  }

  private resolveLogoutMessage(event: SessionEvent & { type: 'LOGOUT' }): string {
    if (event.message) return event.message;

    switch (event.reason) {
      case 'TIMEOUT':
      case 'IDLE_TIMEOUT':
        return this.messages.sessionTimeout || 'Sua sessao expirou por inatividade.';
      case 'SESSION_LIMIT':
      case 'OTHER_SESSION':
        return 'Sua sessao foi encerrada por limite de dispositivos.';
      case 'USER_BLOCKED':
        return this.messages.loginBlockedUser || 'Seu usuario foi bloqueado.';
      case 'USER_INVISIBLE':
        return 'Seu usuario foi ocultado e bloqueado.';
      case 'PASSWORD_CHANGED':
        return 'Sua senha foi alterada. Faca login novamente.';
      case 'PERMISSIONS_CHANGED':
        return 'Suas permissoes mudaram. Faca login novamente.';
      case 'SERVER_INVALIDATED':
        return this.messages.sessionRevoked || 'Sua sessao foi invalidada.';
      default:
        return this.messages.sessionMaxTime || 'Sua sessao expirou por tempo maximo de uso.';
    }
  }

  private showSingleToast(
    type: 'success' | 'error' | 'warning',
    _key: string,
    message: string,
    options?: any,
  ): void {
    if (!message) return;
    this.toast.clear();

    if (type === 'success') {
      this.toast.success(message, undefined, options);
      return;
    }

    if (type === 'warning') {
      this.toast.warning(message, undefined, options);
      return;
    }

    this.toast.error(message, undefined, options);
  }

  private extractErrorCode(error: any): string {
    const message = error?.error?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }
    return '';
  }

  private getMessage(candidate: unknown, fallback: string): string {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
    return fallback;
  }
}
