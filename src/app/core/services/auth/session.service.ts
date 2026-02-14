import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';

import firebaseApp from '../../../firebase.config';
import { FirebaseService } from '../database/firebase.service';
import { PresenceService, USER_SITUATION } from '../application/presence.service';

type LogoutReason = 'MANUAL' | 'SESSION_EXPIRED' | 'BLOCKED';
type SessionExpireReason = 'TIMEOUT' | 'MAX_SESSION' | null;

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  // ------------------------------------------------------
  // CONSTANTS
  // ------------------------------------------------------

  private readonly LOGOUT_EVENT_KEY = 'app-logout-event';
  private readonly LAST_LOGIN_KEY = 'last-login-time';
  private readonly LAST_ACTIVITY_KEY = 'last-user-activity';
  private readonly LOGOUT_REASON_KEY = 'logout-reason';

  private readonly IDLE_TIMEOUT = 30 * 60 * 1000;
  private readonly MAX_SESSION_TIME = 8 * 60 * 60 * 1000;
  private readonly CHECK_INTERVAL = 10 * 1000;

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------

  private readonly auth: Auth = getAuth(firebaseApp);
  private sessionCheckInterval?: ReturnType<typeof setInterval>;

  // ------------------------------------------------------
  // STREAM STATE
  // ------------------------------------------------------

  private userSubject = new BehaviorSubject<any | null>(null);
  public readonly user$ = this.userSubject.asObservable();

  // ------------------------------------------------------
  // CONSTRUCTOR
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
  // SESSION INIT
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

    const savedUser = localStorage.getItem('userData');

    if (savedUser) {
      this.userSubject.next(JSON.parse(savedUser));
    }
  }

  // ------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------

  async logout(reason: LogoutReason = 'MANUAL'): Promise<void> {

    try {

      if (reason !== 'BLOCKED') {
        await this.presenceService.forceOffline();
      }

      localStorage.setItem(this.LOGOUT_EVENT_KEY, 'true');

      await signOut(this.auth);

    } finally {

      this.performLocalLogout();

      setTimeout(() => {
        localStorage.removeItem(this.LOGOUT_EVENT_KEY);
      }, 1000);
    }
  }

  private performLocalLogout(): void {

    this.presenceService.stop();
    this.clearSessionStorage();

    this.router.navigate(['/login']);
  }

  // ------------------------------------------------------
  // SESSION EXPIRATION
  // ------------------------------------------------------

  isSessionExpired(): SessionExpireReason {

    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    const lastLogin = localStorage.getItem(this.LAST_LOGIN_KEY);

    if (!lastLogin) return null;

    const now = Date.now();
    const sessionStart = new Date(lastLogin).getTime();

    if (now - sessionStart > this.MAX_SESSION_TIME) {
      return 'MAX_SESSION';
    }

    const reference = lastActivity
      ? new Date(lastActivity).getTime()
      : sessionStart;

    if (now - reference > this.IDLE_TIMEOUT) {
      return 'TIMEOUT';
    }

    return null;
  }

  private checkTokenExpiration(): void {

    const reason = this.isSessionExpired();

    if (!reason) return;

    sessionStorage.setItem(this.LOGOUT_REASON_KEY, reason);

    this.logout('SESSION_EXPIRED');
  }

  private startTokenExpirationWatcher(): void {

    this.stopTokenExpirationWatcher();

    this.sessionCheckInterval = setInterval(
      () => this.checkTokenExpiration(),
      this.CHECK_INTERVAL
    );
  }

  private stopTokenExpirationWatcher(): void {

    if (!this.sessionCheckInterval) return;

    clearInterval(this.sessionCheckInterval);
    this.sessionCheckInterval = undefined;
  }

  // ------------------------------------------------------
  // USER ACTIVITY TRACKING
  // ------------------------------------------------------

  private trackUserActivity(): void {

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    let lastWrite = 0;

    const resetActivity = () => {

      const now = Date.now();

      if (now - lastWrite < 5000) return;

      localStorage.setItem(
        this.LAST_ACTIVITY_KEY,
        new Date().toISOString()
      );

      lastWrite = now;
    };

    events.forEach(event =>
      window.addEventListener(event, resetActivity, { passive: true })
    );
  }

  // ------------------------------------------------------
  // STORAGE SYNC (MULTI TAB)
  // ------------------------------------------------------

  private setupStorageSync(): void {

    window.addEventListener('storage', (event: StorageEvent) => {

      if (
        event.key === this.LOGOUT_EVENT_KEY &&
        event.newValue === 'true'
      ) {
        this.performLocalLogout();
      }
    });
  }

  // ------------------------------------------------------
  // SESSION STORAGE
  // ------------------------------------------------------

  clearSessionStorage(): void {

    this.userSubject.next(null);

    this.firebaseService.unsubscribe('user');

    localStorage.removeItem('userData');
    localStorage.removeItem(this.LOGOUT_EVENT_KEY);
    localStorage.removeItem(this.LAST_LOGIN_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);

    this.stopTokenExpirationWatcher();
  }

  setLastLoginTime(): void {

    const now = new Date().toISOString();

    localStorage.setItem(this.LAST_LOGIN_KEY, now);
    localStorage.setItem(this.LAST_ACTIVITY_KEY, now);
  }

  // ------------------------------------------------------
  // AUTH
  // ------------------------------------------------------

  getAuthInstance(): Auth {
    return this.auth;
  }

  getAuthState(): Observable<User | null> {

    return new Observable(subscriber => {

      const unsubscribe = onAuthStateChanged(
        this.auth,
        user => {

          if (!user) {
            this.clearSessionStorage();
          }

          subscriber.next(user);
        }
      );

      return () => unsubscribe();
    });
  }

  // ------------------------------------------------------
  // USER LOAD
  // ------------------------------------------------------

  private async resolveGroupPermissions(groupIds: string[]): Promise<string[]> {

    const groups = await this.firebaseService.getList('groups');

    const permissions = groupIds
      .map(id => groups.find(g => g['id'] === id))
      .filter(g => g?.['permissions']?.length)
      .flatMap(g => g!['permissions']);

    return Array.from(new Set(permissions));
  }

  async loadAndSetUserOnce(uid: string): Promise<void> {

    return new Promise((resolve, reject) => {

      let first = true;

      this.firebaseService.subscribe(`users/${uid}`, async userData => {

        try {

          if (!userData) {
            await this.logout();
            reject('USER_NOT_FOUND');
            return;
          }

          if (userData.situation === USER_SITUATION.BLOCKED) {
            await this.logout('BLOCKED');
            reject('BLOCKED');
            return;
          }

          if (first) {
            this.presenceService.start(uid);
            first = false;
          }

          const groupIds: string[] =
            Array.isArray(userData['groups'])
              ? userData['groups']
              : userData['group']
                ? [userData['group']]
                : [];

          const permissionsFromGroups =
            await this.resolveGroupPermissions(groupIds);

          const mergedPermissions = Array.from(
            new Set([
              ...(permissionsFromGroups ?? []),
              ...(userData['permissions'] ?? [])
            ])
          );

          this.userSubject.next({
            ...userData,
            permissions: mergedPermissions
          });

          resolve();

        } catch (err) {
          reject(err);
        }
      });
    });
  }
}