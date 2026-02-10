import { Injectable, OnDestroy } from '@angular/core';
import {
    getDatabase,
    ref,
    get,
    set,
    update,
    push,
    remove,
    onValue,
    off,
    DataSnapshot
} from 'firebase/database';
import firebaseApp from '../../../firebase.config';
import { combineLatest, Subscription } from 'rxjs';
import { TabManagerService } from '../auth/tab-manager.service';

type Entity = {
    uid?: string;
    [key: string]: any;
};

type WriteMode = 'create' | 'update' | 'push';

@Injectable({
    providedIn: 'root',
})
export class FirebaseService implements OnDestroy {

    // ------------------------------------------------------
    // FIREBASE: CORE DATABASE
    // ------------------------------------------------------

    private readonly db = getDatabase(firebaseApp);

    // ------------------------------------------------------
    // REALTIME: STATE CONTROL
    // ------------------------------------------------------

    private masterSubscription!: Subscription;
    private firebaseListeners = new Map<string, any>();
    private activeSubscriptions = new Map<string, { path: string, callback: Function }>();

    // ------------------------------------------------------
    // REALTIME: CACHE
    // ------------------------------------------------------

    private lastDataCache = new Map<string, any>();

    // ------------------------------------------------------
    // REALTIME: BROADCAST CHANNEL
    // ------------------------------------------------------

    private broadcastChannel?: BroadcastChannel;

    constructor(private tabManager: TabManagerService) {

        // ------------------------------------------------------
        // REALTIME: MASTER / VISIBILITY OBSERVER
        // ------------------------------------------------------

        this.masterSubscription = combineLatest([
            this.tabManager.isVisible$,
            this.tabManager.isMaster$
        ]).subscribe(() => this.evaluateRealtimeState());

        // ------------------------------------------------------
        // REALTIME: BROADCAST INIT
        // ------------------------------------------------------

        if ('BroadcastChannel' in window) {

            this.broadcastChannel = new BroadcastChannel('firebase-realtime-sync');

            this.broadcastChannel.onmessage = (event) => {
                this.handleBroadcastMessage(event.data);
            };

            // Sync inicial
            setTimeout(() => {
                this.broadcastChannel?.postMessage({ type: 'REQUEST_SYNC' });
            }, 500);
        }
    }

    // ------------------------------------------------------
    // LIFECYCLE: DESTROY
    // ------------------------------------------------------

    ngOnDestroy() {
        this.pauseAllRealtime();
        this.masterSubscription?.unsubscribe();
        this.broadcastChannel?.close();
    }

    // ------------------------------------------------------
    // FIREBASE: REF HELPER
    // ------------------------------------------------------

    private ref(path: string) {
        return ref(this.db, path);
    }

    // ------------------------------------------------------
    // SNAPSHOT: PROCESSOR
    // ------------------------------------------------------

    private processSnapshot(snapshot: DataSnapshot): any {

        if (!snapshot.exists()) return [];

        const value = snapshot.val();

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const keys = Object.keys(value);
            if (keys.length > 0 && typeof value[keys[0]] === 'object') {
                return this.snapshotToList(snapshot);
            }
        }

        return value ?? [];
    }

    private snapshotToList(snapshot: DataSnapshot): Entity[] {
        return Object.entries(snapshot.val() || {}).map(([uid, value]) => ({
            uid,
            ...(value as object),
        }));
    }

    // ------------------------------------------------------
    // FIREBASE: WRITE OPERATIONS
    // ------------------------------------------------------

    async write(path: string, data: Entity, mode: WriteMode) {

        const reference = this.ref(path);

        if (mode === 'create') return set(reference, data);
        if (mode === 'push') return push(reference, data);
        if (mode === 'update') return update(reference, data);
    }

    async delete(path: string) {
        return remove(this.ref(path));
    }

    // ------------------------------------------------------
    // FIREBASE: READ OPERATIONS
    // ------------------------------------------------------

    async getList(path: string): Promise<Entity[]> {
        const snapshot = await get(this.ref(path));
        return this.snapshotToList(snapshot);
    }

    async getById(path: string): Promise<Entity | null> {

        const snapshot = await get(this.ref(path));

        return snapshot.exists()
            ? { uid: path.split('/').pop(), ...snapshot.val() }
            : null;
    }

    async getByField(path: string, field: string, value: any): Promise<Entity[]> {

        const list = await this.getList(path);
        return list.filter(item => item[field] === value);
    }

    // ------------------------------------------------------
    // REALTIME: SUBSCRIBE ENTRY POINT
    // ------------------------------------------------------

    subscribe(path: string, callback: (data: any) => void) {

        this.unsubscribe(path);

        this.activeSubscriptions.set(path, { path, callback });

        // Cache imediato
        const cached = this.lastDataCache.get(path);
        if (cached !== undefined) callback(cached);

        const shouldRunRealtime =
            this.tabManager.isVisible &&
            this.tabManager.master;

        if (shouldRunRealtime) {
            this.activateRealtime(path, callback);
        } else {
            this.requestPathSync(path);
        }
    }

    // ------------------------------------------------------
    // REALTIME: FIREBASE LISTENER CONTROL
    // ------------------------------------------------------

    private activateRealtime(path: string, callback: Function) {

        const listener = onValue(this.ref(path), snapshot => {

            const data = this.processSnapshot(snapshot);

            this.lastDataCache.set(path, data);
            callback(data);

            this.broadcastChannel?.postMessage({
                type: 'REALTIME_UPDATE',
                path,
                data
            });

        });

        this.firebaseListeners.set(path, listener);
    }

    private pauseAllRealtime() {

        this.firebaseListeners.forEach((listener, path) => {
            off(this.ref(path), 'value', listener);
        });

        this.firebaseListeners.clear();
    }

    private resumeAllRealtime() {

        this.activeSubscriptions.forEach(sub => {

            if (this.firebaseListeners.has(sub.path)) return;

            this.activateRealtime(sub.path, sub.callback);
        });

        console.log('🔥 Firebase realtime reativado');
    }

    // ------------------------------------------------------
    // REALTIME: MASTER STATE CONTROL
    // ------------------------------------------------------

    private evaluateRealtimeState() {

        const shouldRunRealtime =
            this.tabManager.isVisible &&
            this.tabManager.master;

        if (shouldRunRealtime) {
            this.resumeAllRealtime();
        } else {
            this.pauseAllRealtime();
        }
    }

    // ------------------------------------------------------
    // REALTIME: BROADCAST HANDLERS
    // ------------------------------------------------------

    private requestPathSync(path: string) {
        this.broadcastChannel?.postMessage({
            type: 'REQUEST_PATH_SYNC',
            path
        });
    }

    private handleBroadcastMessage(message: any) {

        // MASTER → envia cache geral
        if (message.type === 'REQUEST_SYNC' && this.tabManager.master) {

            this.lastDataCache.forEach((data, path) => {
                this.broadcastChannel?.postMessage({
                    type: 'REALTIME_UPDATE',
                    path,
                    data
                });
            });

            return;
        }

        // MASTER → envia cache por path
        if (message.type === 'REQUEST_PATH_SYNC' && this.tabManager.master) {

            const data = this.lastDataCache.get(message.path);

            if (data !== undefined) {
                this.broadcastChannel?.postMessage({
                    type: 'REALTIME_UPDATE',
                    path: message.path,
                    data
                });
            }

            return;
        }

        // SLAVE → recebe update
        if (message.type === 'REALTIME_UPDATE' && !this.tabManager.master) {

            const sub = this.activeSubscriptions.get(message.path);
            if (sub) sub.callback(message.data);
        }
    }

    // ------------------------------------------------------
    // REALTIME: UNSUBSCRIBE
    // ------------------------------------------------------

    unsubscribe(path: string) {

        const listener = this.firebaseListeners.get(path);

        if (listener) {
            off(this.ref(path), 'value', listener);
            this.firebaseListeners.delete(path);
        }

        this.activeSubscriptions.delete(path);
    }
}
