import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { RegisterService } from '../services/register.service';
import { User } from 'firebase/auth';
import { map, Observable, take, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private loginService: LoginService,
    private registerService: RegisterService
  ) { }

  canActivate(): Observable<boolean> {
    return this.loginService.getAuthState().pipe(
      take(1),
      map(async (user: User | null) => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        console.log('Usuário autenticado:', user);

        try {
          await this.loginService.loadAndSetUser(user.uid);
          return true;
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          this.router.navigate(['/login']);
          return false;
        }
      }),
      switchMap(result => result)
    );
  }


  canActivateRegister(requiredStepForRoute: number): boolean {
    const currentStep = this.registerService.currentStep;

    if (currentStep < requiredStepForRoute) {
      this.router.navigate(['/register']);
      return false;
    }
    return true;
  }
}
