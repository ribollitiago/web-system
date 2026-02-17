import { Injectable, OnDestroy } from '@angular/core';
import { FirebaseService } from '../database/firebase.service';
import { formatDateShortBR } from '../../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class PresenceService implements OnDestroy {

  private readonly PATH = {
    CONNECTED: '.info/connected'
  };

  private currentUid?: string;
  private connectedListener?: (isConnected: boolean) => void;

  constructor(
    private firebaseService: FirebaseService
  ) {}

  // ======================================================
  // PUBLIC API
  // ======================================================

  async start(uid: string): Promise<void> {

    if (!uid) return;
    if (this.currentUid === uid) return;

    await this.stop(this.currentUid, true);
    this.currentUid = uid;

    await this.initializeSession(uid);
    this.setupConnectionListener(uid);
  }

  async stop(uid?: string, skipRemoteCleanup = false): Promise<void> {

    const targetUid = uid ?? this.currentUid;
    if (!targetUid) return;

    this.removeConnectionListener();

    if (!skipRemoteCleanup) {
      await this.cleanupRemoteSession(targetUid);
    }

    if (!uid) this.currentUid = undefined;
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ======================================================
  // SESSION SETUP
  // ======================================================

  private async initializeSession(uid: string): Promise<void> {

    await this.firebaseService.write(
      this.sessionPath(uid),
      {
        lastSeen: null,
        isOnline: true,
        revoked: false,
        blocked: false
      },
      'update'
    );
  }

  // ======================================================
  // CONNECTION LISTENER
  // ======================================================

  private setupConnectionListener(uid: string): void {

    const sessionPath = this.sessionPath(uid);
    const onlinePath = this.onlinePath(uid);

    this.connectedListener = async (isConnected: boolean) => {

      if (!isConnected) return;

      try {

        await this.firebaseService
          .onDisconnect(sessionPath)
          .update({
            lastSeen: formatDateShortBR(new Date()),
            isOnline: null,
            revoked: null
          });

        await this.firebaseService
          .onDisconnect(onlinePath)
          .remove();

      } catch (error) {
        console.error('Presence onDisconnect error:', error);
      }
    };

    this.firebaseService.subscribe(
      this.PATH.CONNECTED,
      this.connectedListener
    );
  }

  private removeConnectionListener(): void {

    if (!this.connectedListener) return;

    this.firebaseService.unsubscribe(
      this.PATH.CONNECTED,
      this.connectedListener
    );

    this.connectedListener = undefined;
  }

  // ======================================================
  // REMOTE CLEANUP
  // ======================================================

  private async cleanupRemoteSession(uid: string): Promise<void> {

    await Promise.all([
      this.firebaseService.write(
        this.sessionPath(uid),
        {
          lastSeen: formatDateShortBR(new Date()),
          isOnline: null,
          revoked: null
        },
        'update'
      ),

      this.firebaseService.delete(
        this.onlinePath(uid)
      )
    ]);
  }

  // ======================================================
  // PATH HELPERS
  // ======================================================

  private sessionPath(uid: string): string {
    return `users/${uid}/session`;
  }

  private onlinePath(uid: string): string {
    return `system/onlineUsers/${uid}`;
  }
}