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
    const reason = this.sessionService.isSessionExpired();

    if (reason) {
      sessionStorage.setItem('logout-reason', reason);
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

        await this.sessionService.loadAndSetUser(user.uid);
        return true;
      }),
      switchMap(result => result)
    );
  }
}
