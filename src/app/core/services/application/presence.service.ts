import { Injectable, OnDestroy } from '@angular/core';
import { FirebaseService } from '../database/firebase.service';
import { formatDateShortBR } from '../../utils/date.utils';

export const USER_SITUATION = {
    BLOCKED: 0,
    OFFLINE: 1,
    ONLINE: 2
} as const;

@Injectable({
    providedIn: 'root'
})
export class PresenceService implements OnDestroy {

    // ------------------------------------------------------
    // PROPERTIES
    // ------------------------------------------------------

    private readonly connectedPath = '.info/connected';
    private currentUid?: string;

    // ------------------------------------------------------
    // CONSTRUCTOR
    // ------------------------------------------------------

    constructor(
        private firebaseService: FirebaseService
    ) {}

    // ------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------

    start(uid: string): void {

        if (this.currentUid === uid) return;

        this.stop();
        this.currentUid = uid;

        const userPath = this.getUserPath(uid);

        this.firebaseService.subscribe(
            this.connectedPath,
            async (isConnected: boolean) => {

                if (!isConnected) return;

                await this.firebaseService
                    .onDisconnect(userPath)
                    .update(this.buildPresencePayload(USER_SITUATION.OFFLINE));

                await this.firebaseService.write(
                    userPath,
                    this.buildPresencePayload(USER_SITUATION.ONLINE),
                    'update'
                );
            }
        );
    }

    async forceOffline(): Promise<void> {

        if (!this.currentUid) return;

        const userPath = this.getUserPath(this.currentUid);

        await this.firebaseService.write(
            userPath,
            this.buildPresencePayload(USER_SITUATION.OFFLINE),
            'update'
        );

        await this.firebaseService
            .onDisconnect(userPath)
            .cancel();
    }

    stop(): void {

        if (this.currentUid) {
            this.firebaseService.unsubscribe(this.connectedPath);
        }

        this.currentUid = undefined;
    }

    // ------------------------------------------------------
    // PRIVATE HELPERS
    // ------------------------------------------------------

    private getUserPath(uid: string): string {
        return `users/${uid}`;
    }

    private buildPresencePayload(situation: number) {
        return {
            situation,
            lastSession: formatDateShortBR(new Date())
        };
    }

    // ------------------------------------------------------
    // LIFECYCLE
    // ------------------------------------------------------

    ngOnDestroy(): void {
        this.stop();
    }
}