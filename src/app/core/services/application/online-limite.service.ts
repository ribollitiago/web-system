import { Injectable } from '@angular/core';
import { FirebaseService } from '../database/firebase.service';
import { TabManagerService } from './tab-manager.service';

@Injectable({ providedIn: 'root' })
export class OnlineLimitService {

    private readonly MAX_ONLINE = 2;
    private readonly ONLINE_PATH = 'system/onlineUsers';

    constructor(private firebase: FirebaseService, private tabManager: TabManagerService) { }

    async canEnter(sessionId: any): Promise<boolean> {

        const list = await this.firebase.getList(this.ONLINE_PATH);

        if (list.some((s: any) => s.sessionId === sessionId)) {
            return true;
        }

        return list.length < this.MAX_ONLINE;
    }
    async add(uid: string, sessionId: string) {

        await this.firebase.write(
            `${this.ONLINE_PATH}/${uid}`,
            {
                sessionId,
                lastHeartbeat: Date.now()
            },
            'set'
        );
    }

    async remove(uid: string) {

        await this.firebase.delete(`${this.ONLINE_PATH}/${uid}`);
    }
}