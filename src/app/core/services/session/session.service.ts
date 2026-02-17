import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';

import firebaseApp from '../../../firebase.config';
import { FirebaseService } from '../database/firebase.service';
import { PresenceService } from '../application/presence.service';
import { formatDateShortBR } from '../../utils/date.utils';
import { OnlineLimitService } from '../application/online-limite.service';

type SessionExpireReason = 'TIMEOUT' | 'MAX_SESSION' | null;

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  // ------------------------------------------------------
  // CONSTANTS
  // ------------------------------------------------------

  private readonly STORAGE = {
    LOGOUT_EVENT: 'app-logout-event',
    LAST_LOGIN: 'last-login-time',
    LAST_ACTIVITY: 'last-user-activity',
    LOGOUT_REASON: 'logout-reason',
    SESSION_ID: 'session-id'
  };

  private readonly TIME = {
    IDLE_TIMEOUT: 30 * 60 * 1000,       // 30 minutos
    MAX_SESSION: 8 * 60 * 60 * 1000,    // 8 horas
    CHECK_INTERVAL: 10 * 1000           // 10 segundos
  };

  private groups: any[] | undefined;
  private userSubscriptionPath?: string;
  private sessionCheckInterval?: ReturnType<typeof setInterval>;

  // ------------------------------------------------------
  // AUTH & STREAM STATE
  // ------------------------------------------------------

  private readonly auth: Auth = getAuth(firebaseApp);
  private userSubject = new BehaviorSubject<any | null>(null);
  public readonly user$ = this.userSubject.asObservable();

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private presenceService: PresenceService,
    private onlineLimitService: OnlineLimitService
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
  }

  // ------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------

  async logout(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE.LOGOUT_EVENT, 'true');

      if (this.auth.currentUser) {
        await this.onlineLimitService.remove(this.auth.currentUser.uid);
      }

      await signOut(this.auth);
    } finally {
      this.performLocalLogout();

      // Remove flag de logout após breve delay
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
  // SESSION EXPIRATION
  // ------------------------------------------------------

  isSessionExpired(): SessionExpireReason {
    const lastActivity = localStorage.getItem(this.STORAGE.LAST_ACTIVITY);
    const lastLogin = localStorage.getItem(this.STORAGE.LAST_LOGIN);

    if (!lastLogin) return null;

    const now = Date.now();
    const sessionStart = new Date(lastLogin).getTime();

    if (now - sessionStart > this.TIME.MAX_SESSION) return 'MAX_SESSION';

    const reference = lastActivity ? new Date(lastActivity).getTime() : sessionStart;

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
    this.sessionCheckInterval = setInterval(() => this.checkTokenExpiration(), this.TIME.CHECK_INTERVAL);
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

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastWrite < 5000) return;

      localStorage.setItem(this.STORAGE.LAST_ACTIVITY, new Date().toISOString());
      lastWrite = now;
    };

    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));
  }

  // ------------------------------------------------------
  // STORAGE SYNC
  // ------------------------------------------------------

  private setupStorageSync(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === this.STORAGE.LOGOUT_EVENT && event.newValue === 'true') {
        this.performLocalLogout();
      }
    });
  }

  // ------------------------------------------------------
  // SESSION STORAGE
  // ------------------------------------------------------

  clearSessionStorage(): void {
    this.userSubject.next(null);

    if (this.userSubscriptionPath) {
      this.firebaseService.unsubscribe(this.userSubscriptionPath);
      this.userSubscriptionPath = undefined;
    }

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
  // AUTH HELPERS
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
  // REALTIME USER SESSION
  // ------------------------------------------------------

  async loadAndSetUser(uid: string): Promise<void> {
    this.userSubscriptionPath = this.userPath(uid);
    const sessionId = this.ensureSessionId();

    let isFirstEmission = true;
    let resolved = false;

    return new Promise((resolve, reject) => {
      const handleUserData = async (userData: any) => {
        try {
          await this.validateUserExists(userData);
          await this.validateBlocked(userData);

          if (isFirstEmission) {
            isFirstEmission = await this.handleSessionOwnership(uid, sessionId, userData);
          } else {
            await this.validateRuntimeSession(userData, sessionId);
          }

          await this.emitUser(userData);

          if (!resolved) {
            resolved = true;
            resolve();
          }

        } catch (error) {
          reject(error);
        }
      };

      this.firebaseService.subscribe(this.userSubscriptionPath!, handleUserData);
    });
  }

  // ------------------------------------------------------
  // SESSION HELPERS
  // ------------------------------------------------------

  private ensureSessionId(): string {
    let sessionId = localStorage.getItem(this.STORAGE.SESSION_ID);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(this.STORAGE.SESSION_ID, sessionId);
    }
    return sessionId;
  }

  private userPath(uid: string) {
    return `users/${uid}`;
  }

  // ------------------------------------------------------
  // USER VALIDATIONS
  // ------------------------------------------------------

  private async validateUserExists(userData: any) {
    if (!userData) {
      await this.logout();
      throw 'USER_NOT_FOUND';
    }
  }

  private async validateBlocked(userData: any) {
    if (userData.session?.blocked) {
      await this.logout();
      throw 'BLOCKED';
    }
  }

  private async validateRuntimeSession(userData: any, sessionId: string) {
    if (userData.session?.id !== sessionId) {
      await this.logout();
      throw 'OTHER_SESSION';
    }

    if (userData.session?.revoked) {
      await this.logout();
      throw 'REVOKED';
    }
  }

  // ------------------------------------------------------
  // SESSION OWNERSHIP HANDLING
  // ------------------------------------------------------

  private async handleSessionOwnership(uid: string, sessionId: string, userData: any) {
    const isMySession = userData.session?.id === sessionId;

    await this.ensureOnlineLimit();

    if (!isMySession) {
      await this.createSession(uid, sessionId);
    }

    await this.onlineLimitService.add(uid, sessionId);
    this.presenceService.start(uid);

    return false;
  }

  private async ensureOnlineLimit() {
    const canEnter = await this.onlineLimitService.canEnter();
    if (!canEnter) {
      await this.logout();
      throw 'MAX_ONLINE_REACHED';
    }
  }

  // ------------------------------------------------------
  // CREATE SESSION
  // ------------------------------------------------------

  private async createSession(uid: string, sessionId: string) {
    await this.firebaseService.write(`users/${uid}/session`, {
      id: sessionId,
      lastLogin: formatDateShortBR(new Date()),
      device: navigator.userAgent
    }, 'set');
  }

  // ------------------------------------------------------
  // USER EMISSION
  // ------------------------------------------------------

  private async emitUser(userData: any) {
    this.userSubject.next({
      ...userData,
      permissions: await this.resolveMergedPermissions(userData)
    });
  }

  private async resolveMergedPermissions(userData: any): Promise<string[]> {
    const groupIds: string[] = Array.isArray(userData.groups)
      ? userData.groups
      : userData.group
        ? [userData.group]
        : [];

    const groupPermissions = await this.resolveGroupPermissions(groupIds);

    return Array.from(new Set([...(groupPermissions ?? []), ...(userData.permissions ?? [])]));
  }

  private async resolveGroupPermissions(groupIds: string[]): Promise<string[]> {
    if (!this.groups) {
      this.groups = await this.firebaseService.getList('groups');
    }

    const permissions = groupIds
      .map(id => this.groups?.find(g => g['id'] === id))
      .filter(g => g?.['permissions']?.length)
      .flatMap(g => g!.permissions);

    return Array.from(new Set(permissions));
  }
}
