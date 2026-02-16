import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { SessionService } from '../services/session/session.service';

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {}

  canActivate() {
    return this.sessionService.getAuthState().pipe(
      take(1),
      map(user => {
        if (user) {
          this.router.navigate(['/home']);
          return false;
        }
        return true;
      })
    );
  }
}
