import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import {
  User,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';

import { FirebaseService } from '../database/firebase.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private sessionService: SessionService
  ) { }

  // ------------------------------------------------------
  // SEÇÃO: LOGIN
  // ------------------------------------------------------

  login(email: string, password: string): Observable<any> {
    const auth = this.sessionService.getAuthInstance();
    return from(
      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => this.handleLoginSuccess(userCredential))
        .catch(this.handleError)
    );
  }

  private async handleLoginSuccess(userCredential: any): Promise<{ uid: string }> {
    const user = userCredential.user;

    if (!user) {
      throw new Error('User not found');
    }

    this.sessionService.setLastLoginTime();
    this.router.navigate(['/home']);

    return { uid: user.uid };
  }

  // ------------------------------------------------------
  // SEÇÃO: RECUPERAÇÃO DE SENHA
  // ------------------------------------------------------

  recoverPassword(email: string): Observable<void> {
    const auth = this.sessionService.getAuthInstance();
    return this.handleFirebaseOperation(
      () => sendPasswordResetEmail(auth, email)
    );
  }

  // ------------------------------------------------------
  // SEÇÃO: ESTADO DE AUTENTICAÇÃO
  // ------------------------------------------------------

  getAuthState(): Observable<User | null> {
    const auth = this.sessionService.getAuthInstance();

    return new Observable(subscriber => {
      onAuthStateChanged(auth, user => {
        if (!user) {
          this.sessionService.clearSessionStorage();
        }
        subscriber.next(user);
      });
    });
  }

  // ------------------------------------------------------
  // SEÇÃO: FUNÇÕES AUXILIARES
  // ------------------------------------------------------

  private handleError(error: any): void {
    console.error('Erro:', error);
  }

  private handleFirebaseOperation(
    operation: () => Promise<any>
  ): Observable<any> {
    return from(
      operation()
        .then(() => console.log('Operação concluída com sucesso.'))
        .catch(this.handleError)
    );
  }

  // ------------------------------------------------------
  // SEÇÃO: LOGOUT
  // ------------------------------------------------------

  async logout(): Promise<void> {
    await this.sessionService.logout();
  }
}