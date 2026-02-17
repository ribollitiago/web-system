import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import {
  User,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  Unsubscribe
} from 'firebase/auth';

import { SessionService } from '../session/session.service';

interface LoginResult {
  uid: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------

  constructor(
    private router: Router,
    public sessionService: SessionService
  ) { }

  // ------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------

  login(email: string, password: string): Observable<LoginResult> {

    const auth = this.sessionService.getAuthInstance();

    return from(
      signInWithEmailAndPassword(auth, email, password)
        .then(credential => this.handleLoginSuccess(credential))
        .catch(error => this.handleError(error))
    );
  }

  recoverPassword(email: string): Observable<void> {

    const auth = this.sessionService.getAuthInstance();

    return this.handleFirebaseOperation(() =>
      sendPasswordResetEmail(auth, email)
    );
  }

  getAuthState(): Observable<User | null> {

    const auth = this.sessionService.getAuthInstance();

    return new Observable(subscriber => {

      const unsubscribe: Unsubscribe = onAuthStateChanged(auth, user => {

        if (!user) {
          this.sessionService.clearSessionStorage();
        }

        subscriber.next(user);
      });

      return () => unsubscribe();
    });
  }

  async logout(): Promise<void> {
    await this.sessionService.logout();
  }

  // ------------------------------------------------------
  // LOGIN FLOW
  // ------------------------------------------------------

  private async handleLoginSuccess(userCredential: any): Promise<LoginResult> {

    const user = userCredential?.user;

    if (!user) {
      throw new Error('User not found');
    }

    this.sessionService.setLastLoginTime();
    this.sessionService.startTokenExpirationWatcher();
    this.sessionService.trackUserActivity();

    await this.router.navigate(['/home']);

    return { uid: user.uid };
  }

  // ------------------------------------------------------
  // FIREBASE HELPERS
  // ------------------------------------------------------

  private handleFirebaseOperation<T>(
    operation: () => Promise<T>
  ): Observable<T> {

    return from(
      operation().catch(error => this.handleError(error))
    );
  }

  // ------------------------------------------------------
  // ERROR HANDLING
  // ------------------------------------------------------

  private handleError(error: unknown): never {

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unexpected authentication error');
  }
}