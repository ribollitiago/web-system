import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, from, map, of, switchMap, take } from 'rxjs';
import { SessionService } from '../services/core/session/session.service';

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
      switchMap((session) => {
        if (!session) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return of(false);
        }

        return from(this.sessionService.validateCurrentSession()).pipe(
          map((isValid) => {
            if (!isValid) {
              this.sessionService.logout();
              return false;
            }

            this.sessionService.loadAndSetUser();
            return true;
          }),
        );
      }),
    );
  }
}
