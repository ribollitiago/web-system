import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';

import firebaseApp from '../../../firebase.config';
import { FirebaseService } from '../database/firebase.service';
import { PresenceService } from '../application/presence.service';
import { formatDateShortBR } from '../../utils/date.utils';

type SessionExpireReason = 'TIMEOUT' | 'MAX_SESSION' | null;

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  // ------------------------------------------------------
  // START CONSTANTS
  // ------------------------------------------------------

  private readonly STORAGE = {
    LOGOUT_EVENT: 'app-logout-event',
    LAST_LOGIN: 'last-login-time',
    LAST_ACTIVITY: 'last-user-activity',
    LOGOUT_REASON: 'logout-reason',
    SESSION_ID: 'session-id',
    USER_DATA: 'userData'
  };

  private readonly TIME = {
    IDLE_TIMEOUT: 30 * 60 * 1000,
    MAX_SESSION: 8 * 60 * 60 * 1000,
    CHECK_INTERVAL: 10 * 1000
  };

  private groups: any[] | undefined;

  // ------------------------------------------------------
  // START SESSION CONTROL
  // ------------------------------------------------------

  private userSubscriptionPath?: string;

  // ------------------------------------------------------
  // START STATE
  // ------------------------------------------------------

  private readonly auth: Auth = getAuth(firebaseApp);
  private sessionCheckInterval?: ReturnType<typeof setInterval>;

  // ------------------------------------------------------
  // START STREAM STATE
  // ------------------------------------------------------

  private userSubject = new BehaviorSubject<any | null>(null);
  public readonly user$ = this.userSubject.asObservable();
  private activeListenerToken: string | undefined;

  // ------------------------------------------------------
  // START CONSTRUCTOR
  // ------------------------------------------------------

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private presenceService: PresenceService
  ) {
    this.initializeSession();
    this.setupStorageSync();
  }

  // ------------------------------------------------------
  // START SESSION INIT
  // ------------------------------------------------------

  private initializeSession(): void {

    if (this.isSessionExpired()) {
      this.logout();
      return;
    }

    this.startTokenExpirationWatcher();
    this.trackUserActivity();
    this.loadInitialUser();
  }

  private loadInitialUser(): void {
    const savedUser = localStorage.getItem(this.STORAGE.USER_DATA);
    if (savedUser) this.userSubject.next(JSON.parse(savedUser));
  }

  // ------------------------------------------------------
  // START LOGOUT
  // ------------------------------------------------------

  async logout(): Promise<void> {

    try {
      localStorage.setItem(this.STORAGE.LOGOUT_EVENT, 'true');
      await signOut(this.auth);

    } finally {

      this.performLocalLogout();

      setTimeout(() => {
        localStorage.removeItem(this.STORAGE.LOGOUT_EVENT);
      }, 1000);
    }
  }

  private performLocalLogout(): void {

    this.presenceService.stop();
    this.clearSessionStorage();
    this.router.navigate(['/login']);
  }

  // ------------------------------------------------------
  // START SESSION EXPIRATION
  // ------------------------------------------------------

  isSessionExpired(): SessionExpireReason {

    const lastActivity = localStorage.getItem(this.STORAGE.LAST_ACTIVITY);
    const lastLogin = localStorage.getItem(this.STORAGE.LAST_LOGIN);

    if (!lastLogin) return null;

    const now = Date.now();
    const sessionStart = new Date(lastLogin).getTime();

    if (now - sessionStart > this.TIME.MAX_SESSION) return 'MAX_SESSION';

    const reference =
      lastActivity
        ? new Date(lastActivity).getTime()
        : sessionStart;

    if (now - reference > this.TIME.IDLE_TIMEOUT) return 'TIMEOUT';

    return null;
  }

  private checkTokenExpiration(): void {

    const reason = this.isSessionExpired();
    if (!reason) return;

    sessionStorage.setItem(this.STORAGE.LOGOUT_REASON, reason);
    this.logout();
  }

  private startTokenExpirationWatcher(): void {

    this.stopTokenExpirationWatcher();

    this.sessionCheckInterval = setInterval(
      () => this.checkTokenExpiration(),
      this.TIME.CHECK_INTERVAL
    );
  }

  private stopTokenExpirationWatcher(): void {

    if (!this.sessionCheckInterval) return;

    clearInterval(this.sessionCheckInterval);
    this.sessionCheckInterval = undefined;
  }

  // ------------------------------------------------------
  // START USER ACTIVITY TRACKING
  // ------------------------------------------------------

  private trackUserActivity(): void {

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    let lastWrite = 0;

    const resetActivity = () => {

      const now = Date.now();
      if (now - lastWrite < 5000) return;

      localStorage.setItem(
        this.STORAGE.LAST_ACTIVITY,
        new Date().toISOString()
      );

      lastWrite = now;
    };

    events.forEach(event =>
      window.addEventListener(event, resetActivity, { passive: true })
    );
  }

  // ------------------------------------------------------
  // START STORAGE SYNC
  // ------------------------------------------------------

  private setupStorageSync(): void {

    window.addEventListener('storage', (event: StorageEvent) => {

      if (
        event.key === this.STORAGE.LOGOUT_EVENT &&
        event.newValue === 'true'
      ) {
        this.performLocalLogout();
      }
    });
  }

  // ------------------------------------------------------
  // START SESSION STORAGE
  // ------------------------------------------------------

  clearSessionStorage(): void {

    this.userSubject.next(null);

    if (this.userSubscriptionPath) {
      this.firebaseService.unsubscribe(this.userSubscriptionPath);
      this.userSubscriptionPath = undefined;
    }

    localStorage.removeItem(this.STORAGE.USER_DATA);
    localStorage.removeItem(this.STORAGE.LAST_LOGIN);
    localStorage.removeItem(this.STORAGE.LAST_ACTIVITY);
    localStorage.removeItem(this.STORAGE.SESSION_ID);

    this.stopTokenExpirationWatcher();
  }

  setLastLoginTime(): void {

    const now = new Date().toISOString();

    localStorage.setItem(this.STORAGE.LAST_LOGIN, now);
    localStorage.setItem(this.STORAGE.LAST_ACTIVITY, now);
  }

  // ------------------------------------------------------
  // START AUTH
  // ------------------------------------------------------

  getAuthInstance(): Auth {
    return this.auth;
  }

  getAuthState(): Observable<User | null> {

    return new Observable(subscriber => {

      const unsubscribe = onAuthStateChanged(this.auth, user => {

        if (!user) this.clearSessionStorage();
        subscriber.next(user);
      });

      return () => unsubscribe();
    });
  }

  // ------------------------------------------------------
  // START REALTIME USER SESSION
  // ------------------------------------------------------

  async loadAndSetUserOnce(uid: string): Promise<void> {
    this.userSubscriptionPath = `users/${uid}`;

    let sessionId = localStorage.getItem(this.STORAGE.SESSION_ID);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(this.STORAGE.SESSION_ID, sessionId);
    }

    return new Promise((resolve, reject) => {
      let isFirstEmission = true;

      const handleUserData = async (userData: any) => {
        try {

          // Qualquer verificação antes de realmente pegar o usuario

          if (!userData) {
            await this.logout();
            reject('USER_NOT_FOUND');
            return;
          }

          if (userData.blocked) {
            await this.logout();
            reject('BLOCKED');
            return;
          }

          // Agora que o usuario pode se dizer online e com sessão

          if (isFirstEmission) {
            await this.createSession(uid, sessionId);
            this.presenceService.start(uid);
            isFirstEmission = false;
          } else {

            // Tudo aqui vai ocorrer após a primeira emissão

            if (userData.session?.id !== sessionId) {
              await this.logout();
              reject('OTHER_SESSION');
              return;
            }

            if (userData.revoked) {
              await this.logout();
              reject('REVOKED');
              return;
            }
          }

          // Pegando o usuario e seus grupos/permissoes

          this.userSubject.next({
            ...userData,
            permissions: await this.resolveMergedPermissions(userData)
          });
          resolve();

        } catch (err) {
          reject(err);
        }
      };

      this.firebaseService.subscribe(this.userSubscriptionPath!, handleUserData);
    });
  }

  // ------------------------------------------------------------------
  // Função auxiliar para criar a sessão no Firebase
  // ------------------------------------------------------------------
  private async createSession(uid: string, sessionId: string) {
    await this.firebaseService.write(`users/${uid}/session`, {
      id: sessionId,
      lastLogin: formatDateShortBR(new Date()),
      isOnline: true,
      device: navigator.userAgent,
      revoked: false
    }, 'set');
  }


  private async resolveMergedPermissions(userData: any): Promise<string[]> {

    const groupIds: string[] =
      Array.isArray(userData.groups)
        ? userData.groups
        : userData.group
          ? [userData.group]
          : [];

    const groupPermissions =
      await this.resolveGroupPermissions(groupIds);

    return Array.from(
      new Set([
        ...(groupPermissions ?? []),
        ...(userData.permissions ?? [])
      ])
    );
  }

  private async resolveGroupPermissions(groupIds: string[]): Promise<string[]> {

    if (!this.groups) {
      this.groups = await this.firebaseService.getList('groups');
    }

    const permissions = groupIds
      .map(id => this.groups?.find(g => g['id'] === id))
      .filter(g => g?.['permissions']?.length)
      .flatMap(g => g!['permissions']);

    return Array.from(new Set(permissions));
  }
}
