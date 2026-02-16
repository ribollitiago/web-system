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
  ) { }

  // ------------------------------------------------------
  // START
  // ------------------------------------------------------

  start(uid: string): void {
    if (!uid) return;
    if (this.currentUid === uid) return;

    this.stop(this.currentUid);
    this.currentUid = uid;

    const sessionPath = `users/${uid}/session`;

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
      } catch (err) {
        console.error('Presence error:', err);
      }
    };

    this.firebaseService.subscribe(this.PATH.CONNECTED, this.connectedListener);
  }

  // ------------------------------------------------------
  // STOP
  // ------------------------------------------------------

  async stop(uid?: string): Promise<void> {
    const targetUid = uid ?? this.currentUid;
    if (!targetUid) return;

    if (this.connectedListener) {
      this.firebaseService.unsubscribe(this.PATH.CONNECTED, this.connectedListener);
      this.connectedListener = undefined;
    }

    await this.firebaseService.write(`users/${targetUid}/session`, {
      lastSeen: formatDateShortBR(new Date()),
      isOnline: null,
      revoked: null
    }, 'update');

    if (!uid) this.currentUid = undefined;
  }


  // ------------------------------------------------------
  // DESTROY
  // ------------------------------------------------------

  ngOnDestroy(): void {
    this.stop();
  }
}
