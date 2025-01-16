import { Component } from '@angular/core';
import { DefaultLoginLayoutComponent } from '../../../components/default-login-layout/default-login-layout.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrimaryInputComponent } from '../../../components/primary-input/primary-input.component';
import { Router } from '@angular/router';
import { LoginService } from '../../../services/login.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  imports: [
    DefaultLoginLayoutComponent,
    ReactiveFormsModule,
    PrimaryInputComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  forgotForm!: FormGroup;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastService: ToastrService
  ) {
    this.forgotForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  submit() {
    const email = this.forgotForm.value.email;

    if (this.forgotForm.valid) {
      this.loginService.recoverPassword(email).subscribe({
        next: () => {
          this.toastService.success('E-mail de recuperação enviado com sucesso!');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Erro ao enviar e-mail de recuperação', err);
          this.toastService.error('Erro ao enviar o e-mail de recuperação. Tente novamente!');
        }
      });
    } else {
      this.toastService.error('Por favor, insira um e-mail válido.');
    }
  }

  navigate() {
    this.router.navigate(["/login"]);
  }
}
