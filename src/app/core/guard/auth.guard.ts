import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { User } from 'firebase/auth';
import { Observable, take, switchMap, of } from 'rxjs';
import { SessionService } from '../services/session/session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private sessionService: SessionService
  ) { }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const expirationReason = this.sessionService.isSessionExpired();
    if (expirationReason) {
      sessionStorage.setItem('logout-reason', expirationReason);
      this.sessionService.logout();
      return of(false);
    }

    return this.sessionService.getAuthState().pipe(
      take(1),
      switchMap(async (user: User | null) => {

        if (!user) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        try {
          await this.sessionService.loadAndSetUserOnce(user.uid);
          return true;
        } catch {
          return false;
        }
      })
    );
  }
}
