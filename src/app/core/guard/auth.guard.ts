import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { User } from 'firebase/auth';
import { map, Observable, take, switchMap, of } from 'rxjs';
import { SessionService } from '../services/auth/session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private sessionService: SessionService
  ) { }

  canActivate(): Observable<boolean> {
    if (this.sessionService.isSessionExpired()) {
      console.log('AuthGuard: Sessão expirada localmente. Redirecionando...');
      this.sessionService.logout();
      return of(false);
    }

    return this.sessionService.getAuthState().pipe(
      take(1),
      map(async (user: User | null) => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        try {
          await this.sessionService.loadAndSetUser(user.uid);
          return true;
        } catch (error) {
          console.error('AuthGuard: Erro ao carregar usuário:', error);
          this.router.navigate(['/login']);
          return false;
        }
      }),
      switchMap(result => result)
    );
  }
}
