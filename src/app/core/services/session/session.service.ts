import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';

import firebaseApp from '../../../firebase.config';
import { FirebaseService } from '../database/firebase.service';
import { PresenceService } from '../application/presence.service';

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

  private sessionId = crypto.randomUUID();
  private userSubscriptionPath?: string;
  private isDestroyed = false;

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
      this.isDestroyed = true;

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

    return new Promise((resolve, reject) => {

      this.prepareRealtimeSession(uid);

      let isFirstEmission = true;

      this.firebaseService.subscribe(
        this.userSubscriptionPath!,
        async userData => {

          try {

            if (!this.isRealtimeValid()) return;

            if (!userData) {
              await this.handleUserNotFound(reject);
              return;
            }

            if (this.isUserBlocked(userData)) {
              await this.logout();
              return;
            }

            if (isFirstEmission) {
              await this.handleFirstEmission(uid);
              isFirstEmission = false;
              return;
            }

            if (!this.isSessionOwner(userData)) {
              await this.logout();
              return;
            }

            await this.updateUserState(userData);

            resolve();

          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  // ------------------------------------------------------
  // START REALTIME HELPERS
  // ------------------------------------------------------

  private prepareRealtimeSession(uid: string): void {

    this.isDestroyed = false;

    const listenerToken = crypto.randomUUID();

    this.userSubscriptionPath = `users/${uid}`;
  }

  private isRealtimeValid(): boolean {
    return !this.isDestroyed;
  }

  private isUserBlocked(userData: any): boolean {
    return userData.session?.revoked || userData.blocked;
  }

  private isSessionOwner(userData: any): boolean {
    return userData.session?.id === this.sessionId;
  }

  private async handleFirstEmission(uid: string): Promise<void> {

    await this.firebaseService.write(
      `users/${uid}/session`,
      {
        id: this.sessionId,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        lastSeenAt: Date.now(),
        device: navigator.userAgent,
        revoked: false
      },
      'create'
    );

    this.presenceService.start(uid);
  }

  private async updateUserState(userData: any): Promise<void> {

    const permissions = await this.resolveMergedPermissions(userData);

    this.userSubject.next({
      ...userData,
      permissions
    });
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
      console.log('teste')
    }

    const permissions = groupIds
      .map(id => this.groups?.find(g => g['id'] === id))
      .filter(g => g?.['permissions']?.length)
      .flatMap(g => g!['permissions']);

    return Array.from(new Set(permissions));
  }

  private async handleUserNotFound(
    reject: (reason?: any) => void
  ): Promise<void> {

    await this.logout();
    reject('USER_NOT_FOUND');
  }
}
