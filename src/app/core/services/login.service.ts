import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { User, getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import firebaseApp from '../../firebase.config';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private auth;
  private readonly LOGOUT_EVENT_KEY = 'app-logout-event';
  private readonly LAST_LOGIN_KEY = 'last-login-time';
  private readonly LAST_ACTIVITY_KEY = 'last-user-activity';
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000;
  private readonly MAX_SESSION_TIME = 8 * 60 * 60 * 1000;
  private readonly CHECK_INTERVAL = 10 * 1000;
  private userSubject = new BehaviorSubject<any | null>(null);
  user$ = this.userSubject.asObservable();


  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
  ) {
    this.auth = getAuth(firebaseApp);
    this.setupMultiTabLogoutListener();
    this.startTokenExpirationWatcher();
    this.trackUserActivity();
  }

  // ------------------------------------------------------
  // SEÇÃO: LOGOUT ENTRE ABAS
  // ------------------------------------------------------

  private setupMultiTabLogoutListener(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === this.LOGOUT_EVENT_KEY && event.newValue === 'true') {
        this.logout()
          .catch(this.handleError);
      }
    });
  }

  async logout(): Promise<void> {
    try {
      localStorage.setItem(this.LOGOUT_EVENT_KEY, 'true');
      localStorage.setItem(this.LAST_ACTIVITY_KEY, new Date().toISOString());
      await this.auth.signOut();
      this.clearSessionStorage();

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

  private async handleLoginSuccess(userCredential: any): Promise<{ uid: string }> {
    const user = userCredential.user;

    if (!user) {
      throw new Error('User not found');
    }

    localStorage.setItem(this.LAST_LOGIN_KEY, new Date().toISOString());

    // Se for necessario, adicione.
    // await this.loadAndSetUser(user.uid);

    this.router.navigate(['/home']);

    return { uid: user.uid };
  }



  async loadAndSetUser(uid: string): Promise<void> {
    const userData = await this.firebaseService.getEntityById('users', uid);

    if (!userData) {
      throw new Error('Usuário não encontrado no banco');
    }

    localStorage.setItem('userData', JSON.stringify(userData));

    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      this.userSubject.next(JSON.parse(savedUser));
    }
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
      this.auth.onAuthStateChanged(user => {
        if (!user) {
          this.clearSessionStorage();
        }
        subscriber.next(user);
      });
    });
  }

  private checkTokenExpiration(): void {
    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    const lastLogin = localStorage.getItem(this.LAST_LOGIN_KEY);

    if (!lastLogin) return;

    const now = new Date().getTime();

    if (lastActivity) {
      const idleTime = now - new Date(lastActivity).getTime();
      if (idleTime > this.IDLE_TIMEOUT) {
        console.log('Logout por inatividade');
        this.logout();
        return;
      }
    }

    const sessionTime = now - new Date(lastLogin).getTime();
    if (sessionTime > this.MAX_SESSION_TIME) {
      console.log('Logout por tempo máximo de sessão');
      this.logout();
    }
  }

  private startTokenExpirationWatcher(): void {
    setInterval(() => {
      this.checkTokenExpiration();
    }, this.CHECK_INTERVAL);
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

  private clearSessionStorage(): void {
    this.userSubject.next(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem(this.LOGOUT_EVENT_KEY);
    localStorage.removeItem(this.LAST_LOGIN_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);
  }

  private trackUserActivity(): void {
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    const resetActivity = () => {
      localStorage.setItem(this.LAST_ACTIVITY_KEY, new Date().toISOString());
    };

    events.forEach(event =>
      window.addEventListener(event, resetActivity)
    );
  }
}
