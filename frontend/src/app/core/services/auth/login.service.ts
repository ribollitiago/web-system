import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';

import { SessionService, AuthStateUser } from '../core/session/session.service';

interface LoginResult {
  uid: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  constructor(
    private readonly router: Router,
    public readonly sessionService: SessionService,
  ) {}

  login(email: string, password: string): Observable<LoginResult> {
    return from(
      this.sessionService.loginWithBackend(email, password)
        .then((authUser) => this.handleLoginSuccess(authUser))
        .catch((error) => this.handleError(error)),
    );
  }

  recoverPassword(email: string): Observable<void> {
    return from(
      this.sessionService.recoverPassword(email).catch((error) => this.handleError(error)),
    );
  }

  getAuthState(): Observable<AuthStateUser | null> {
    return this.sessionService.getAuthState();
  }

  async logout(): Promise<void> {
    await this.sessionService.logout();
  }

  private async handleLoginSuccess(user: AuthStateUser): Promise<LoginResult> {
    this.sessionService.setLastLoginTime();
    this.sessionService.startTokenExpirationWatcher();
    this.sessionService.trackUserActivity();

    await this.router.navigate(['/home']);

    return { uid: user.uid };
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      throw error;
    }

    const backendError = (error as { error?: { message?: string } })?.error?.message;
    if (backendError) {
      const normalized = new Error(backendError);
      (normalized as Error & { code?: string }).code = backendError;
      throw normalized;
    }

    throw new Error('Unexpected authentication error');
  }
}
