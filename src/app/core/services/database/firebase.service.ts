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
import { TabManagerService } from '../auth/TabManager.service';
import { Subscription } from 'rxjs';

type Entity = {
    uid?: string;
    [key: string]: any;
};

type WriteMode = 'create' | 'update' | 'push';
type ChildListenMode = 'added' | 'changed' | 'removed';

@Injectable({
    providedIn: 'root',
})
export class FirebaseService implements OnDestroy {

    private readonly db = getDatabase(firebaseApp);
    private subscriptions: Record<string, boolean> = {};
    private activeSubscriptions: Map<string, { path: string, callback: Function }> = new Map();
    private tabSubscription: Subscription;

    constructor(private tabManager: TabManagerService) {
        this.tabSubscription = this.tabManager.isVisible$.subscribe(visible => {
            if (!visible) {
                this.pauseAllSubscriptions();
            } else {
                this.resumeAllSubscriptions();
            }
        });
    }

    ngOnDestroy() {
        this.pauseAllSubscriptions();
        if (this.tabSubscription) this.tabSubscription.unsubscribe();
    }

    private ref(path: string) {
        return ref(this.db, path);
    }

    private processSnapshot(snapshot: DataSnapshot): any {
        if (!snapshot.exists()) return [];

        const value = snapshot.val();

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const keys = Object.keys(value);
            if (keys.length > 0 && typeof value[keys[0]] === 'object') {
                return this.snapshotToList(snapshot);
            }
        }

        return value !== undefined ? value : [];
    }

    // ------------------------------------------------------
    // SNAPSHOT → ARRAY ENTITY
    // ------------------------------------------------------

    private snapshotToList(snapshot: DataSnapshot): Entity[] {
        if (!snapshot.exists()) return [];

        return Object.entries(snapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as object),
        }));
    }

    // ------------------------------------------------------
    // ESCRITA GENÉRICA
    // ------------------------------------------------------

    async write(path: string, data: Entity, mode: WriteMode) {
        const reference = this.ref(path);

        if (mode === 'create') return set(reference, data);
        else if (mode === 'push') return push(reference, data);
        else if (mode === 'update') return update(reference, data);

        return console.error('');
    }

    // ------------------------------------------------------
    // DELETE
    // ------------------------------------------------------

    async delete(path: string) {
        return remove(this.ref(path));
    }

    // ------------------------------------------------------
    // READ
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

    async getByField(
        path: string,
        field: string,
        value: any
    ): Promise<Entity[]> {

        const list = await this.getList(path);
        return list.filter(item => item[field] === value);
    }

    // ------------------------------------------------------
    // SUBSCRIBE GENÉRICO
    // ------------------------------------------------------

    subscribe(path: string, callback: (data: any) => void) {
        if (this.subscriptions[path]) {
            this.unsubscribe(path);
        }

        this.activeSubscriptions.set(path, { path, callback });

        if (this.tabManager.isVisible) {
            this.activateListener(path, callback);
            this.subscriptions[path] = true;
        }
    }

    private activateListener(path: string, callback: Function) {
        onValue(this.ref(path), snapshot => {
            callback(this.processSnapshot(snapshot));
        });
    }

    private pauseAllSubscriptions() {
        this.activeSubscriptions.forEach((value, path) => {
            off(this.ref(path));
        });
        console.log('Firebase: Listeners desativados (Aba em background).');
    }

    private resumeAllSubscriptions() {
        this.activeSubscriptions.forEach((sub, path) => {
            this.activateListener(sub.path, sub.callback);
        });
        console.log('Firebase: Listeners reativados (Aba ativa).');
    }

    unsubscribe(path: string, mode?: ChildListenMode) {
        const key = mode ? `${path}_${mode}` : path;
        if (!this.subscriptions[key]) return;
        off(this.ref(path));
        delete this.subscriptions[key];
        if (!mode) this.activeSubscriptions.delete(path);
    }
}