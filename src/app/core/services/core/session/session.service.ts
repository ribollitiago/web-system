import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { DatabaseService } from '../../database/database.service';
import { RealtimeService } from '../../database/realtime.service';

type SessionExpireReason =
  | 'TIMEOUT'
  | 'MAX_SESSION'
  | 'OTHER_SESSION'
  | 'SERVER_INVALIDATED'
  | null;

export type SessionEvent =
  | { type: 'SUCCESS'; message?: string }
  | { type: 'ERROR'; message: string }
  | { type: 'LOGOUT'; reason?: SessionExpireReason };

type JwtPayload = {
  sub?: number;
  sid?: string;
  email?: string;
  exp?: number;
};

type SessionInfo = {
  userId: number;
  sessionId: string;
  email: string;
  exp?: number;
};

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly STORAGE = {
    LAST_LOGIN: 'last-login-time',
    LAST_ACTIVITY: 'last-user-activity',
    ACCESS_TOKEN: 'access-token',
    SESSION_ID: 'session-id',
  };

  private readonly TIME = {
    IDLE_TIMEOUT: 30 * 60 * 1000,
    MAX_SESSION: 8 * 60 * 60 * 1000,
    CHECK_INTERVAL: 5 * 1000,
  };

  private sessionCheckInterval?: ReturnType<typeof setInterval>;
  private activityListenersAttached = false;
  private realtimeListenersAttached = false;

  private userSubject = new BehaviorSubject<any | null>(null);
  public readonly user$ = this.userSubject.asObservable();

  private authSubject = new BehaviorSubject<SessionInfo | null>(null);
  public readonly auth$ = this.authSubject.asObservable();

  private sessionSubject = new ReplaySubject<SessionEvent | null>(1);
  public readonly sessionEvents$ = this.sessionSubject.asObservable();

  private readonly handleSessionInvalidated = (payload: any) => {
    const currentSessionId = this.getSessionId();

    if (!payload) return;
    if (payload.sessionId && payload.sessionId !== currentSessionId) return;

    this.sessionSubject.next({
      type: 'LOGOUT',
      reason: 'SERVER_INVALIDATED',
    });

    this.performLocalLogout('SERVER_INVALIDATED');
  };

  private readonly handlePermissionsUpdated = (payload: any) => {
    if (!payload?.permissions) return;

    const current = this.userSubject.value;
    if (!current) return;

    this.userSubject.next({
      ...current,
      permissions: payload.permissions,
    });
  };

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private realtimeService: RealtimeService,
  ) {
    this.restoreSessionFromStorage();
  }

  isSessionExpired(): SessionExpireReason {
    const tokenPayload = this.getTokenPayload();
    if (!tokenPayload?.exp) return null;

    const now = Date.now();
    if (tokenPayload.exp * 1000 < now) return 'MAX_SESSION';

    const lastActivity = localStorage.getItem(this.STORAGE.LAST_ACTIVITY);
    const lastLogin = localStorage.getItem(this.STORAGE.LAST_LOGIN);
    if (!lastLogin) return null;

    const sessionStart = new Date(lastLogin).getTime();
    if (now - sessionStart > this.TIME.MAX_SESSION) return 'MAX_SESSION';

    const reference = lastActivity ? new Date(lastActivity).getTime() : sessionStart;
    if (now - reference > this.TIME.IDLE_TIMEOUT) return 'TIMEOUT';

    return null;
  }

  public startTokenExpirationWatcher(): void {
    this.stopTokenExpirationWatcher();
    this.sessionCheckInterval = setInterval(
      () => this.checkTokenExpiration(),
      this.TIME.CHECK_INTERVAL,
    );
  }

  public trackUserActivity(): void {
    if (this.activityListenersAttached) return;

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    let lastWrite = 0;

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastWrite < 5000) return;
      localStorage.setItem(this.STORAGE.LAST_ACTIVITY, new Date().toISOString());
      lastWrite = now;
    };

    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    this.activityListenersAttached = true;
  }

  async logout(reason?: 'OTHER_SESSION'): Promise<void> {
    const token = this.getAccessToken();
    const shouldCallServer = !!token && reason !== 'OTHER_SESSION';

    try {
      if (shouldCallServer) {
        await this.databaseService.logout();
      }
    } finally {
      await this.performLocalLogout(reason ?? null);
    }
  }

  async clearSessionStorage(): Promise<void> {
    this.userSubject.next(null);
    this.authSubject.next(null);
    this.sessionSubject.next(null);

    localStorage.removeItem(this.STORAGE.LAST_LOGIN);
    localStorage.removeItem(this.STORAGE.LAST_ACTIVITY);
    localStorage.removeItem(this.STORAGE.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE.SESSION_ID);

    this.stopTokenExpirationWatcher();
    this.detachRealtimeListeners();
    this.realtimeService.disconnect();
  }

  setLastLoginTime(): void {
    const now = new Date().toISOString();
    localStorage.setItem(this.STORAGE.LAST_LOGIN, now);
    localStorage.setItem(this.STORAGE.LAST_ACTIVITY, now);
  }

  getAuthState(): Observable<SessionInfo | null> {
    return this.auth$;
  }

  isAuthenticated(): boolean {
    return !!this.authSubject.value && !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE.ACCESS_TOKEN);
  }

  getSessionId(): string | null {
    return localStorage.getItem(this.STORAGE.SESSION_ID);
  }

  getCurrentUserId(): number | null {
    return this.authSubject.value?.userId ?? null;
  }

  async startAuthenticatedSession(accessToken: string, sessionId: string): Promise<void> {
    localStorage.setItem(this.STORAGE.ACCESS_TOKEN, accessToken);
    localStorage.setItem(this.STORAGE.SESSION_ID, sessionId);

    this.setLastLoginTime();
    this.startTokenExpirationWatcher();
    this.trackUserActivity();

    const payload = this.parseJwt(accessToken);
    if (!payload?.sub || !payload?.sid || !payload?.email) {
      await this.performLocalLogout(null);
      throw new Error('Invalid token payload');
    }

    this.authSubject.next({
      userId: payload.sub,
      sessionId: payload.sid,
      email: payload.email,
      exp: payload.exp,
    });

    this.userSubject.next({
      id: payload.sub,
      email: payload.email,
      name: payload.email,
      uid: null,
      enrollment: null,
      permissions: [],
    });

    this.realtimeService.connect(accessToken);
    this.attachRealtimeListeners();

    this.sessionSubject.next({
      type: 'SUCCESS',
      message: 'Sessao iniciada com sucesso!',
    });
  }

  async validateCurrentSession(): Promise<boolean> {
    const token = this.getAccessToken();
    const sessionId = this.getSessionId();

    if (!token || !sessionId) return false;
    if (this.isSessionExpired()) return false;

    try {
      const sessions = (await this.databaseService.getList('auth/sessions')) as any[];
      if (!Array.isArray(sessions)) return false;

      const current = sessions.find((item) => item.id === sessionId);
      return !!current && !current.revoked;
    } catch {
      return false;
    }
  }

  async loadAndSetUser(): Promise<void> {
    const currentUser = this.userSubject.value;
    if (!currentUser?.email) return;

    try {
      const users = (await this.databaseService.getList('users')) as any[];
      const user = users.find(
        (item) =>
          item.email === currentUser.email ||
          (typeof item.uid === 'string' && item.uid === currentUser.uid),
      );
      if (!user) return;

      this.userSubject.next({
        ...currentUser,
        uid: user.uid ?? currentUser.uid,
        enrollment: user.enrollment ?? currentUser.enrollment,
        name: user.name ?? currentUser.name,
        email: user.email ?? currentUser.email,
      });
    } catch {
      // User list can be protected by permission; keep token data as fallback.
    }
  }

  private restoreSessionFromStorage(): void {
    const token = this.getAccessToken();
    const sessionId = this.getSessionId();
    if (!token || !sessionId) return;

    const payload = this.parseJwt(token);
    if (!payload?.sub || !payload?.sid || !payload?.email) {
      this.clearSessionStorage();
      return;
    }

    this.authSubject.next({
      userId: payload.sub,
      sessionId: payload.sid,
      email: payload.email,
      exp: payload.exp,
    });

    this.userSubject.next({
      id: payload.sub,
      email: payload.email,
      name: payload.email,
      uid: null,
      enrollment: null,
      permissions: [],
    });

    this.startTokenExpirationWatcher();
    this.trackUserActivity();
    this.realtimeService.connect(token);
    this.attachRealtimeListeners();
    this.loadAndSetUser();
  }

  private async performLocalLogout(reason: SessionExpireReason): Promise<void> {
    await this.clearSessionStorage();
    this.router.navigate(['/login']);

    if (reason) {
      this.sessionSubject.next({ type: 'LOGOUT', reason });
    }
  }

  private checkTokenExpiration(): void {
    const reason = this.isSessionExpired();
    if (!reason) return;

    this.sessionSubject.next({ type: 'LOGOUT', reason });
    this.logout();
  }

  private stopTokenExpirationWatcher(): void {
    if (!this.sessionCheckInterval) return;
    clearInterval(this.sessionCheckInterval);
    this.sessionCheckInterval = undefined;
  }

  private attachRealtimeListeners(): void {
    if (this.realtimeListenersAttached) return;

    this.realtimeService.on('session_invalidated', this.handleSessionInvalidated);
    this.realtimeService.on('permissions_updated', this.handlePermissionsUpdated);
    this.realtimeListenersAttached = true;
  }

  private detachRealtimeListeners(): void {
    if (!this.realtimeListenersAttached) return;

    this.realtimeService.off('session_invalidated', this.handleSessionInvalidated);
    this.realtimeService.off('permissions_updated', this.handlePermissionsUpdated);
    this.realtimeListenersAttached = false;
  }

  private getTokenPayload(): JwtPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    return this.parseJwt(token);
  }

  private parseJwt(token: string): JwtPayload | null {
    try {
      const [, base64Payload] = token.split('.');
      if (!base64Payload) return null;

      const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalized)) as JwtPayload;
      return payload;
    } catch {
      return null;
    }
  }
}
