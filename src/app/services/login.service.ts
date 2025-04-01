import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';

import { User, getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import firebaseApp from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private auth;
  private readonly LOGOUT_EVENT_KEY = 'app-logout-event';

  constructor(private router: Router) {
    this.auth = getAuth(firebaseApp);
    this.setupMultiTabLogoutListener();
  }

  // ------------------------------------------------------
  // SEÇÃO: LOGOUT ENTRE ABAS
  // ------------------------------------------------------

  private setupMultiTabLogoutListener(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === this.LOGOUT_EVENT_KEY && event.newValue === 'true') {
        this.handleCrossTabLogout();
      }
    });
  }

  private handleCrossTabLogout(): void {
    localStorage.removeItem(this.LOGOUT_EVENT_KEY);
    this.auth.signOut()
      .then(() => {
        this.router.navigate(['/login']);
        console.log('Logout sincronizado entre abas');
      })
      .catch(this.handleError);
  }

  async logout(): Promise<void> {
    try {
      localStorage.setItem(this.LOGOUT_EVENT_KEY, 'true');
      await this.auth.signOut();
      this.router.navigate(['/login']);
      setTimeout(() => localStorage.removeItem(this.LOGOUT_EVENT_KEY), 1000);
    } catch (err) {
      this.handleError(err);
    }
  }

  // ------------------------------------------------------
  // SEÇÃO: LOGIN
  // ------------------------------------------------------

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => this.handleLoginSuccess(userCredential))
      .catch(this.handleError)
    );
  }

  private handleLoginSuccess(userCredential: any): { uid: string } {
    const user = userCredential.user;
    if (user) {
      this.router.navigate(['/home']);
      return { uid: user.uid };
    }
    throw new Error('User not found');
  }

  // ------------------------------------------------------
  // SEÇÃO: RECUPERAÇÃO DE SENHA
  // ------------------------------------------------------

  recoverPassword(email: string): Observable<void> {
    return this.handleFirebaseOperation(() => sendPasswordResetEmail(this.auth, email));
  }

  // ------------------------------------------------------
  // SEÇÃO: VERIFICAÇÃO DE ESTADO DE AUTENTICAÇÃO
  // ------------------------------------------------------

  getAuthState(): Observable<User | null> {
    return new Observable(subscriber => {
      this.auth.onAuthStateChanged(subscriber);
    });
  }

  // ------------------------------------------------------
  // SEÇÃO: FUNÇÕES AUXILIARES
  // ------------------------------------------------------

  private handleError(error: any): void {
    console.error('Erro:', error);
  }

  private handleFirebaseOperation(operation: () => Promise<any>): Observable<any> {
    return from(operation()
      .then(() => console.log('Operação concluída com sucesso.'))
      .catch(this.handleError)
    );
  }
}
