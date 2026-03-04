import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, ReplaySubject, firstValueFrom } from 'rxjs';

import { FirebaseService } from '../../database/firebase.service';
import { PresenceService } from '../application/presence.service';
import { formatDateShortBR } from '../../../utils/date.utils';
import { OnlineLimitService } from '../application/online-limite.service';
import { ApiService } from '../../backend/api.service';

type SessionExpireReason = 'TIMEOUT' | 'MAX_SESSION' | null;

export type SessionEvent =
  | { type: 'SUCCESS'; message?: string }
  | { type: 'ERROR'; message: string }
  | { type: 'LOGOUT'; reason?: SessionExpireReason };

export interface AuthStateUser {
  uid: string;
  email?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly STORAGE = {
    LAST_LOGIN: 'last-login-time',
    LAST_ACTIVITY: 'last-user-activity',
    SESSION_ID: 'session-id',
    AUTH_USER: 'auth-user',
  };

  private readonly TIME = {
    IDLE_TIMEOUT: 30 * 60 * 1000,
    MAX_SESSION: 8 * 60 * 60 * 1000,
    CHECK_INTERVAL: 5 * 1000,
  };

  private groups: any[] | undefined;
  private sessionCheckInterval?: ReturnType<typeof setInterval>;

  private authUserSubject = new BehaviorSubject<AuthStateUser | null>(null);
  private userSubject = new BehaviorSubject<any | null>(null);
  public readonly user$ = this.userSubject.asObservable();

  private sessionSubject = new ReplaySubject<SessionEvent | null>(1);
  public readonly sessionEvents$ = this.sessionSubject.asObservable();

  constructor(
    private readonly router: Router,
    private readonly firebaseService: FirebaseService,
    private readonly presenceService: PresenceService,
    private readonly onlineLimitService: OnlineLimitService,
    private readonly apiService: ApiService,
  ) {
    this.restoreAuthFromStorage();
    this.initializeSession();
  }

  private initializeSession(): void {
    const expiredReason = this.isSessionExpired();
    if (expiredReason) {
      this.sessionSubject.next({ type: 'LOGOUT', reason: expiredReason });
      void this.logout();
      return;
    }
  }

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
    if (reason) {
      this.sessionSubject.next({ type: 'LOGOUT', reason });
      void this.logout();
    }
  }

  public startTokenExpirationWatcher(): void {
    this.stopTokenExpirationWatcher();
    this.sessionCheckInterval = setInterval(() => this.checkTokenExpiration(), this.TIME.CHECK_INTERVAL);
  }

  private stopTokenExpirationWatcher(): void {
    if (!this.sessionCheckInterval) return;
    clearInterval(this.sessionCheckInterval);
    this.sessionCheckInterval = undefined;
  }

  public trackUserActivity(): void {
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    let lastWrite = 0;

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastWrite < 5000) return;
      localStorage.setItem(this.STORAGE.LAST_ACTIVITY, new Date().toISOString());
      lastWrite = now;
    };

    events.forEach((eventName) => window.addEventListener(eventName, updateActivity, { passive: true }));
  }

  async loginWithBackend(email: string, password: string): Promise<AuthStateUser> {
    const response = await firstValueFrom(
      this.apiService.post<{ email: string; password: string }, { uid: string; email: string; idToken: string }>(
        '/auth/login',
        { email, password },
      ),
    );

    const authUser: AuthStateUser = {
      uid: response.uid,
      email: response.email,
      token: response.idToken,
    };

    this.setAuthUser(authUser);
    await this.loadAndSetUser(authUser.uid);

    return authUser;
  }

  async recoverPassword(email: string): Promise<void> {
    await firstValueFrom(
      this.apiService.post<{ email: string }, { success: boolean }>('/auth/recover-password', { email }),
    );
  }

  async logout(reason?: 'OTHER_SESSION'): Promise<void> {
    const authUser = this.getCurrentAuthUser();

    try {
      if (authUser?.uid && reason !== 'OTHER_SESSION') {
        await this.onlineLimitService.remove(authUser.uid);
      }

      if (authUser?.token) {
        await firstValueFrom(
          this.apiService.post<{ token?: string }, { success: boolean }>('/auth/logout', {
            token: authUser.token,
          }),
        );
      }
    } finally {
      await this.performLocalLogout(reason);
    }
  }

  private async performLocalLogout(reason: string | undefined): Promise<void> {
    if (reason !== 'OTHER_SESSION') {
      await this.presenceService.stop();
    }

    await this.clearSessionStorage();
    await this.router.navigate(['/login']);
  }

  async clearSessionStorage(): Promise<void> {
    this.userSubject.next(null);
    this.authUserSubject.next(null);
    this.sessionSubject.next(null);

    localStorage.removeItem(this.STORAGE.LAST_LOGIN);
    localStorage.removeItem(this.STORAGE.LAST_ACTIVITY);
    localStorage.removeItem(this.STORAGE.SESSION_ID);
    localStorage.removeItem(this.STORAGE.AUTH_USER);

    this.stopTokenExpirationWatcher();
  }

  setLastLoginTime(): void {
    const now = new Date().toISOString();
    localStorage.setItem(this.STORAGE.LAST_LOGIN, now);
    localStorage.setItem(this.STORAGE.LAST_ACTIVITY, now);
  }

  getCurrentAuthUser(): AuthStateUser | null {
    return this.authUserSubject.value;
  }

  getAuthState(): Observable<AuthStateUser | null> {
    return this.authUserSubject.asObservable();
  }

  async loadAndSetUser(uid: string): Promise<void> {
    const sessionId = this.ensureSessionId();

    const userData = await this.firebaseService.getById(`users/${uid}`);

    try {
      await this.validateUserAccess(userData);
      await this.bootstrapSession(uid, sessionId, userData ?? {});
      await this.publishUserState(userData ?? {});

      this.emitSuccess();
    } catch (error: unknown) {
      const msg = this.normalizeError(error);
      this.emitError(msg);
      throw error;
    }
  }

  private async validateUserAccess(userData: any | null): Promise<void> {
    if (!userData) {
      await this.logout();
      throw new Error('USER_NOT_FOUND');
    }

    const session = userData['session'] ?? {};

    if (session['blocked']) {
      await this.logout();
      throw new Error('BLOCKED');
    }
  }

  private async bootstrapSession(
    uid: string,
    sessionId: string,
    userData: any,
  ): Promise<void> {
    const session = userData['session'] ?? {};
    const isMySession = session['id'] === sessionId;

    await this.ensureOnlineLimit(sessionId);

    if (!isMySession) {
      await this.createSession(uid, sessionId);
    }

    await this.onlineLimitService.add(uid, sessionId);
    await this.presenceService.start(uid);
  }

  private async createSession(uid: string, sessionId: string): Promise<void> {
    await this.firebaseService.write(`users/${uid}/session`, {
      id: sessionId,
      lastLogin: formatDateShortBR(new Date()),
      device: navigator.userAgent,
      isOnline: true,
      blocked: false,
      revoked: false,
    }, 'update');
  }

  private async ensureOnlineLimit(sessionId: string): Promise<void> {
    const canEnter = await this.onlineLimitService.canEnter(sessionId);

    if (!canEnter) {
      await this.logout();
      throw new Error('MAX_ONLINE_REACHED');
    }
  }

  private emitSuccess(): void {
    this.sessionSubject.next({
      type: 'SUCCESS',
      message: 'Sessao carregada com sucesso!',
    });
  }

  private emitError(message: string): void {
    this.sessionSubject.next({
      type: 'ERROR',
      message,
    });
  }

  private ensureSessionId(): string {
    let sessionId = localStorage.getItem(this.STORAGE.SESSION_ID);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(this.STORAGE.SESSION_ID, sessionId);
    }
    return sessionId;
  }

  private normalizeError(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'UNKNOWN_ERROR';
  }

  private async publishUserState(userData: any): Promise<void> {
    this.userSubject.next({
      ...userData,
      permissions: await this.resolveMergedPermissions(userData),
    });
  }

  private async resolveMergedPermissions(userData: any): Promise<string[]> {
    const groupsRaw = userData['groups'];
    const groupRaw = userData['group'];

    const groupIds: string[] = Array.isArray(groupsRaw)
      ? (groupsRaw as string[])
      : groupRaw
        ? [String(groupRaw)]
        : [];

    const groupPermissions = await this.resolveGroupPermissions(groupIds);
    const userPermissions = Array.isArray(userData['permissions']) ? (userData['permissions'] as string[]) : [];

    return Array.from(new Set([...(groupPermissions ?? []), ...userPermissions]));
  }

  private async resolveGroupPermissions(groupIds: string[]): Promise<string[]> {
    if (!this.groups) {
      this.groups = await this.firebaseService.getList('groups');
    }

    return Array.from(
      new Set(
        groupIds
          .map((id) => this.groups?.find((group) => group['id'] === id))
          .filter((group): group is any => !!group && Array.isArray(group['permissions']))
          .flatMap((group) => group['permissions'] as string[]),
      ),
    );
  }

  private restoreAuthFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE.AUTH_USER);

    if (!raw) {
      return;
    }

    try {
      const authUser = JSON.parse(raw) as AuthStateUser;
      if (authUser?.uid) {
        this.authUserSubject.next(authUser);
      }
    } catch {
      localStorage.removeItem(this.STORAGE.AUTH_USER);
    }
  }

  private setAuthUser(authUser: AuthStateUser): void {
    this.authUserSubject.next(authUser);
    localStorage.setItem(this.STORAGE.AUTH_USER, JSON.stringify(authUser));
  }
}
