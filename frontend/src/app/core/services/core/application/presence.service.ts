import { Injectable, OnDestroy } from '@angular/core';
import { FirebaseService } from '../../database/firebase.service';
import { formatDateShortBR } from '../../../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class PresenceService implements OnDestroy {
  private currentUid?: string;

  constructor(
    private readonly firebaseService: FirebaseService
  ) {}

  async start(uid: string): Promise<void> {
    if (!uid) return;
    if (this.currentUid === uid) return;

    await this.stop(this.currentUid, true);
    this.currentUid = uid;

    await this.initializeSession(uid);
  }

  async stop(uid?: string, skipRemoteCleanup = false): Promise<void> {
    const targetUid = uid ?? this.currentUid;
    if (!targetUid) return;

    if (!skipRemoteCleanup) {
      await this.cleanupRemoteSession(targetUid);
    }

    if (!uid) this.currentUid = undefined;
  }

  ngOnDestroy(): void {
    void this.stop();
  }

  private async initializeSession(uid: string): Promise<void> {
    await this.firebaseService.write(
      this.sessionPath(uid),
      {
        lastSeen: null,
        isOnline: true,
        revoked: false,
        blocked: false,
      },
      'update'
    );
  }

  private async cleanupRemoteSession(uid: string): Promise<void> {
    await Promise.all([
      this.firebaseService.write(
        this.sessionPath(uid),
        {
          lastSeen: formatDateShortBR(new Date()),
          isOnline: null,
          revoked: null,
        },
        'update'
      ),

      this.firebaseService.delete(this.onlinePath(uid)),
    ]);
  }

  private sessionPath(uid: string): string {
    return `users/${uid}/session`;
  }

  private onlinePath(uid: string): string {
    return `system/onlineUsers/${uid}`;
  }
}
