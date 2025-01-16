import { Component } from '@angular/core';
import { DefaultLoginLayoutComponent } from '../../components/default-login-layout/default-login-layout.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrimaryInputComponent } from '../../components/primary-input/primary-input.component';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [DefaultLoginLayoutComponent, ReactiveFormsModule, PrimaryInputComponent],
  providers: [LoginService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm!: FormGroup;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastService: ToastrService
  ) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    })
  }

  submit() {
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

  navigate() {
    this.router.navigate(["forgot-password"])
  }
}
