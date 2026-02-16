import { Injectable, OnDestroy } from '@angular/core';
import { FirebaseService } from '../database/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class PresenceService implements OnDestroy {

  private readonly PATH = {
    CONNECTED: '.info/connected'
  };

  private currentUid?: string;

  constructor(
    private firebaseService: FirebaseService
  ) {}

  // ------------------------------------------------------
  // START
  // ------------------------------------------------------

  start(uid: string): void {

    if (!uid) return;
    if (this.currentUid === uid) return;

    this.stop();
    this.currentUid = uid;

    const sessionPath = `users/${uid}/session`;

    this.firebaseService.subscribe(
      this.PATH.CONNECTED,
      async (isConnected: boolean) => {

        if (!isConnected) return;

        try {

          await this.firebaseService
            .onDisconnect(sessionPath)
            .update({
              lastSeenAt: Date.now()
            });
            
        } catch (err) {
          console.error('Presence error:', err);
        }
      }
    );
  }

  // ------------------------------------------------------
  // STOP
  // ------------------------------------------------------

  stop(): void {

    if (this.currentUid) {
      this.firebaseService.unsubscribe(this.PATH.CONNECTED);
    }

    this.currentUid = undefined;
  }

  // ------------------------------------------------------
  // DESTROY
  // ------------------------------------------------------

  ngOnDestroy(): void {
    this.stop();
  }
}
