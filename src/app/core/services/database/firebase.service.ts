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
    DataSnapshot,
    onDisconnect,
    serverTimestamp,
    runTransaction
} from 'firebase/database';

import firebaseApp from '../../../firebase.config';
import { combineLatest, Subscription } from 'rxjs';
import { TabManagerService } from '../core/application/tab-manager.service';

type Entity = {
    uid?: string;
    [key: string]: any;
};

type WriteMode = 'set' | 'update' | 'push';

@Injectable({
    providedIn: 'root',
})
export class FirebaseService implements OnDestroy {

    // ------------------------------------------------------
    // START CORE CONFIG
    // ------------------------------------------------------

    private readonly db = getDatabase(firebaseApp);

    constructor(private tabManager: TabManagerService) {

        this.masterSubscription = combineLatest([
            this.tabManager.isVisible$,
            this.tabManager.isMaster$
        ]).subscribe(() => this.evaluateRealtimeState());

        this.initBroadcastChannel();
    }

    // ------------------------------------------------------
    // START LIFECYCLE
    // ------------------------------------------------------

    ngOnDestroy() {
        this.pauseAllRealtime();
        this.masterSubscription?.unsubscribe();
        this.broadcastChannel?.close();
    }

    // ------------------------------------------------------
    // START REALTIME STATE
    // ------------------------------------------------------

    private masterSubscription!: Subscription;
    private firebaseListeners = new Map<string, any>();
    private activeSubscriptions = new Map<string, { path: string, callback: Function }>();

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
    // START CACHE
    // ------------------------------------------------------

    private lastDataCache = new Map<string, any>();

    // ------------------------------------------------------
    // START BROADCAST CHANNEL
    // ------------------------------------------------------

    private broadcastChannel?: BroadcastChannel;

    private initBroadcastChannel() {

        if (!('BroadcastChannel' in window)) return;

        this.broadcastChannel = new BroadcastChannel('firebase-realtime-sync');

        this.broadcastChannel.onmessage = (event) => {
            this.handleBroadcastMessage(event.data);
        };

        setTimeout(() => {
            this.broadcastChannel?.postMessage({ type: 'REQUEST_SYNC' });
        }, 500);
    }

    // ------------------------------------------------------
    // START FIREBASE HELPERS
    // ------------------------------------------------------

    private ref(path: string) {
        return ref(this.db, path);
    }

    // ------------------------------------------------------
    // START SNAPSHOT NORMALIZER
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
    // START WRITE OPERATIONS
    // ------------------------------------------------------

    async write(path: string, data: Entity, mode: WriteMode) {

        const reference = this.ref(path);

        if (mode === 'set') return set(reference, data);
        if (mode === 'push') return push(reference, data);
        if (mode === 'update') return update(reference, data);
    }

    async delete(path: string) {
        return remove(this.ref(path));
    }

    // ------------------------------------------------------
    // START READ OPERATIONS
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
    // START REALTIME SUBSCRIBE
    // ------------------------------------------------------

    subscribe(path: string, callback: (data: any) => void) {

        this.unsubscribe(path);

        this.activeSubscriptions.set(path, { path, callback });

        const shouldRunRealtime =
            this.tabManager.isVisible &&
            this.tabManager.master;

        if (shouldRunRealtime) {
            this.activateRealtime(path, callback);
        } else {
            this.requestPathSync(path);
            setTimeout(() => {
                if (!this.lastDataCache.has(path)) {
                    console.warn(`Fallback: Ativando realtime para ${path} em aba não-master.`);
                    this.activateRealtime(path, callback);
                }
            }, 3000);
        }
    }

    // ------------------------------------------------------
    // START REALTIME LISTENER CONTROL
    // ------------------------------------------------------

    private activateRealtime(path: string, callback: Function) {
        const listener = (snapshot: DataSnapshot) => {
            const data = this.processSnapshot(snapshot);
            this.lastDataCache.set(path, data);
            callback(data);

            if (this.tabManager.master) {
                this.broadcastChannel?.postMessage({
                    type: 'REALTIME_UPDATE',
                    path,
                    data
                });
            }
        };

        onValue(this.ref(path), listener);
        this.activeSubscriptions.set(path, { path, callback });
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
    }

    // ------------------------------------------------------
    // START BROADCAST HANDLERS
    // ------------------------------------------------------

    private requestPathSync(path: string) {
        this.broadcastChannel?.postMessage({
            type: 'REQUEST_PATH_SYNC',
            path
        });
    }

    private handleBroadcastMessage(message: any) {

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

        if (message.type === 'REALTIME_UPDATE' && !this.tabManager.master) {

            const sub = this.activeSubscriptions.get(message.path);
            if (sub) sub.callback(message.data);
        }

        if (message.type === 'REALTIME_UPDATE' && !this.tabManager.master) {
            const sub = this.activeSubscriptions.get(message.path);
            if (sub) {
                if (this.firebaseListeners.has(message.path)) {
                    console.warn(`Aba não-master: Desativando fallback para ${message.path} após receber update da master.`);
                    const listener = this.firebaseListeners.get(message.path);
                    this.unsubscribe(message.path, undefined, false);
                }
                sub.callback(message.data);
            }
        }
    }

    // ------------------------------------------------------
    // START LOW LEVEL HELPERS
    // ------------------------------------------------------

    onDisconnect(path: any) {
        return onDisconnect(this.ref(path));
    }

    serverTimestamp() {
        return serverTimestamp();
    }

    async transaction<T>(
        path: string,
        updateFn: (currentData: T | null) => T | null
    ) {
        const reference = this.ref(path);
        return runTransaction(reference, updateFn);
    }

    // ------------------------------------------------------
    // START UNSUBSCRIBE
    // ------------------------------------------------------

    unsubscribe(path: string, optionalListener?: Function, shouldRemoveActiveSubscription: boolean = true) {

        const listener = optionalListener ?? this.firebaseListeners.get(path);

        if (listener) {
            off(this.ref(path), 'value', listener);
            this.firebaseListeners.delete(path);
        }

        if (shouldRemoveActiveSubscription) {
            this.activeSubscriptions.delete(path);
        }
    }

}