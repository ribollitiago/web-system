import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SessionService } from '../core/session/session.service';
import { DatabaseService } from '../database/database.service';

interface LoginResponse {
  access_token: string;
  session_id: string;
}

interface LoginResult {
  userId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private router: Router,
    public sessionService: SessionService,
    private databaseService: DatabaseService,
  ) {}

  login(email: string, password: string): Observable<LoginResult> {
    const device = navigator.userAgent;

    return this.databaseService.login(email, password, device).pipe(
      switchMap((response: any) =>
        from(this.handleLoginSuccess(response as LoginResponse)),
      ),
      catchError((error) => this.handleError(error)),
    );
  }

  recoverPassword(_email: string): Observable<void> {
    return throwError(() => new Error('PASSWORD_RECOVERY_NOT_AVAILABLE'));
  }

  getAuthState() {
    return this.sessionService.getAuthState();
  }

  async logout(): Promise<void> {
    await this.sessionService.logout();
  }

  private async handleLoginSuccess(response: LoginResponse): Promise<LoginResult> {
    if (!response?.access_token || !response?.session_id) {
      throw new Error('INVALID_LOGIN_RESPONSE');
    }

    await this.sessionService.startAuthenticatedSession(
      response.access_token,
      response.session_id,
    );

    await this.sessionService.loadAndSetUser();
    await this.router.navigate(['/home']);

    return { userId: this.sessionService.getCurrentUserId() };
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
