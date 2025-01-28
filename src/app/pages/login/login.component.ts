import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importe o CommonModule
import { LoginService } from '../../services/login.service';
import { ToastrService } from 'ngx-toastr';
import { PrimaryInputComponent } from '../../components/primary-input/primary-input.component';
import { DefaultLoginLayoutComponent } from '../../components/default-login-layout/default-login-layout.component';
import { TranslationService } from '../../services/translate.service';

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
export class LoginComponent {
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  showForgotPasswordForm: boolean = false;

  title: string = '';
  subtitle: string = '';
  btnText: string = '';
  txtLink: string = '';
  placeholderEmail: string = '';
  placeholderPassword: string = '';

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastService: ToastrService,
    private translationService: TranslationService
  ) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });

    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  async ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    const token = sessionStorage.getItem('refresh-token');
    if (token) {
      this.router.navigate(['home']); // Redireciona para home se já estiver logado
    }
  }

  loadTranslations() {
    const section = 'Login_form';
    this.title = this.translationService.getTranslation('titleLgn', section);
    this.subtitle = this.translationService.getTranslation('subtitleLgn', section);
    this.btnText = this.translationService.getTranslation('btnLoginLgn', section);
    this.txtLink = this.translationService.getTranslation('linkForgotPasswordLgn', section);
    this.placeholderEmail = this.translationService.getTranslation('inputEmailLgn', section);
    this.placeholderPassword = this.translationService.getTranslation('inputPasswordLgn', section);
  }

  submit() {
    if (this.showForgotPasswordForm) {
      this.submitForgotPassword();
    } else {
      this.submitLogin();
    }
  }

  submitLogin() {
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    if (this.loginForm.valid) {
      this.loginService.login(email, password).subscribe({
        next: (user) => {
          if (user) {
            console.log('Uid:', user.uid);
            this.toastService.success('Login realizado com sucesso!');
          }
        },
        error: (err) => {
          console.error('Erro no login:', err);
          this.toastService.error('Erro ao fazer login. Verifique suas credenciais.');
        }
      });
    } else {
      this.toastService.error('Por favor, insira um e-mail e senha válidos.');
    }
  }

  submitForgotPassword() {
    const email = this.forgotPasswordForm.value.email;

    if (this.forgotPasswordForm.valid) {
      this.loginService.recoverPassword(email).subscribe({
        next: () => {
          console.log('Email para recuperação:', email);
          this.toastService.success('Email de recuperação enviado com sucesso!');
        },
        error: (err) => {
          console.error('Erro ao tentar recuperar senha:', err);
          this.toastService.error('Erro ao enviar email de recuperação. Tente novamente.');
        }
      });
    } else {
      this.toastService.error('Por favor, insira um e-mail válido.');
    }
  }


  navigate() {
    this.showForgotPasswordForm = !this.showForgotPasswordForm;

    const section = 'Login_form';
    this.title = this.translationService.getTranslation(
      this.showForgotPasswordForm ? 'titleFgt' : 'titleLgn',
      section
    );
    this.subtitle = this.translationService.getTranslation(
      this.showForgotPasswordForm ? 'subtitleFgt' : 'subtitleLgn',
      section
    );
    this.btnText = this.translationService.getTranslation(
      this.showForgotPasswordForm ? 'btnLoginFgt' : 'btnLoginLgn',
      section
    );
    this.txtLink = this.translationService.getTranslation(
      this.showForgotPasswordForm ? 'linkForgotPasswordFgt' : 'linkForgotPasswordLgn',
      section
    );

  }
}
