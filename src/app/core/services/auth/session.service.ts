import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseApp from '../../../firebase.config';
import { FirebaseService } from '../database/firebase.service';

@Injectable({
    providedIn: 'root'
})
export class SessionService {

    // ------------------------------------------------------
    // SEÇÃO: CONFIGURAÇÕES
    // ------------------------------------------------------

    private auth: Auth;
    private readonly LOGOUT_EVENT_KEY = 'app-logout-event';
    private readonly LAST_LOGIN_KEY = 'last-login-time';
    private readonly LAST_ACTIVITY_KEY = 'last-user-activity';

    private readonly IDLE_TIMEOUT = 30 * 60 * 1000;
    private readonly MAX_SESSION_TIME = 8 * 60 * 60 * 1000;
    private readonly CHECK_INTERVAL = 10 * 1000;

    // ------------------------------------------------------
    // SEÇÃO: ESTADO DO USUÁRIO
    // ------------------------------------------------------

    private userSubject = new BehaviorSubject<any | null>(null);
    user$ = this.userSubject.asObservable();

    // ------------------------------------------------------
    // SEÇÃO: CONSTRUTOR
    // ------------------------------------------------------

    constructor(
        private router: Router,
        private firebaseService: FirebaseService
    ) {
        this.auth = getAuth(firebaseApp);
        this.initializeSession();
    }

    // ------------------------------------------------------
    // SEÇÃO: INICIALIZAÇÃO DE SESSÃO
    // ------------------------------------------------------

    private initializeSession(): void {
        if (this.isSessionExpired()) {
            this.logout();
        } else {
            this.setupMultiTabLogoutListener();
            this.startTokenExpirationWatcher();
            this.trackUserActivity();
            this.loadInitialUser();
        }
    }

    private loadInitialUser(): void {
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
            this.userSubject.next(JSON.parse(savedUser));
        }
    }

    private setupMultiTabLogoutListener(): void {
        window.addEventListener('storage', (event: StorageEvent) => {
            if (event.key === this.LOGOUT_EVENT_KEY && event.newValue === 'true') {
                this.logout();
            }
        });
    }

    // ------------------------------------------------------
    // SEÇÃO: LOGOUT
    // ------------------------------------------------------

    async logout(): Promise<void> {
        try {
            localStorage.setItem(this.LOGOUT_EVENT_KEY, 'true');

            await signOut(this.auth);
            this.clearSessionStorage();
            this.router.navigate(['/login']);

            setTimeout(() => localStorage.removeItem(this.LOGOUT_EVENT_KEY), 1000);
        } catch { }
    }

    // ------------------------------------------------------
    // SEÇÃO: CONTROLE DE EXPIRAÇÃO
    // ------------------------------------------------------

    isSessionExpired(): boolean {
        const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
        const lastLogin = localStorage.getItem(this.LAST_LOGIN_KEY);

        if (!lastLogin) {
            return false;
        }

        const now = new Date().getTime();
        const sessionStartTime = new Date(lastLogin).getTime();

        if (now - sessionStartTime > this.MAX_SESSION_TIME) {
            return true;
        }

        const referenceTime = lastActivity
            ? new Date(lastActivity).getTime()
            : sessionStartTime;

        if (now - referenceTime > this.IDLE_TIMEOUT) {
            return true;
        }

        return false;
    }

    private checkTokenExpiration(): void {
        if (this.isSessionExpired()) {
            this.logout();
        }
    }

    private startTokenExpirationWatcher(): void {
        this.stopTokenExpirationWatcher();
        (window as any).sessionCheckInterval = setInterval(() => {
            this.checkTokenExpiration();
        }, this.CHECK_INTERVAL);
    }

    private stopTokenExpirationWatcher(): void {
        if ((window as any).sessionCheckInterval) {
            clearInterval((window as any).sessionCheckInterval);
        }
    }

    // ------------------------------------------------------
    // SEÇÃO: ATIVIDADE DO USUÁRIO
    // ------------------------------------------------------

    private trackUserActivity(): void {
        const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        let lastWrite = 0;
        const resetActivity = () => {
            const now = new Date().getTime();
            if (now - lastWrite > 5000) {
                localStorage.setItem(this.LAST_ACTIVITY_KEY, new Date().toISOString());
                lastWrite = now;
            }
        };

        events.forEach(event =>
            window.addEventListener(event, resetActivity, { passive: true })
        );
    }

    // ------------------------------------------------------
    // SEÇÃO: DADOS DE SESSÃO
    // ------------------------------------------------------

    clearSessionStorage(): void {
        this.userSubject.next(null);
        localStorage.removeItem('userData');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem(this.LOGOUT_EVENT_KEY);
        localStorage.removeItem(this.LAST_LOGIN_KEY);
        localStorage.removeItem(this.LAST_ACTIVITY_KEY);
        this.stopTokenExpirationWatcher();
    }

    setUserData(userData: any): void {
        localStorage.setItem('userData', JSON.stringify(userData));
        this.userSubject.next(userData);
    }

    setLastLoginTime(): void {
        const now = new Date().toISOString();
        localStorage.setItem(this.LAST_LOGIN_KEY, now);
        localStorage.setItem(this.LAST_ACTIVITY_KEY, now);
    }

    // ------------------------------------------------------
    // SEÇÃO: AUTH
    // ------------------------------------------------------

    getAuthInstance(): Auth {
        return this.auth;
    }

    getAuthState(): Observable<User | null> {
        return new Observable(subscriber => {
            onAuthStateChanged(this.auth, user => {
                if (!user) {
                    this.clearSessionStorage();
                }
                subscriber.next(user);
            });
        });
    }

    async loadAndSetUser(uid: string): Promise<void> {
        const userData = await this.firebaseService.getEntityById('users', uid);
        if (!userData) {
            throw new Error('Usuário não encontrado no banco');
        }
        this.setUserData(userData);
    }
}