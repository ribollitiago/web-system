import { Injectable } from '@angular/core';
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
    onChildRemoved,
    onChildAdded,
    onChildChanged
} from 'firebase/database';
import firebaseApp from '../../../firebase.config';

type Entity = {
    uid?: string;
    [key: string]: any;
};

type WriteMode = 'create' | 'update' | 'push';

type ChildListenMode = 'added' | 'changed' | 'removed';

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {

    private readonly db = getDatabase(firebaseApp);
    private subscriptions: Record<string, boolean> = {};

    // ------------------------------------------------------
    // REF
    // ------------------------------------------------------

    private ref(path: string) {
        return ref(this.db, path);
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

        onValue(this.ref(path), snapshot => {
            if (!snapshot.exists()) return callback(null);

            const value = snapshot.val();

            if (value && typeof value === 'object' && !Array.isArray(value)) {

                const firstKey = Object.keys(value)[0];

                if (value[firstKey] && typeof value[firstKey] === 'object') {
                    return callback(this.snapshotToList(snapshot));
                }
            }

            return callback(value);
        });

        this.subscriptions[path] = true;
    }


    subscribeChild(
        path: string,
        mode: ChildListenMode,
        callback: (data: any) => void
    ) {

        const reference = this.ref(path);

        const key = `${path}_${mode}`;

        if (this.subscriptions[key]) this.unsubscribe(path, mode);

        if (mode === 'added') {
            onChildAdded(reference, snapshot => {
                callback({
                    uid: snapshot.key,
                    ...snapshot.val()
                });
            });
        }

        if (mode === 'changed') {
            onChildChanged(reference, snapshot => {
                callback({
                    uid: snapshot.key,
                    ...snapshot.val()
                });
            });
        }

        if (mode === 'removed') {
            onChildRemoved(reference, snapshot => {
                callback(snapshot.key);
            });
        }

        this.subscriptions[key] = true;
    }

    unsubscribe(path: string, mode?: ChildListenMode) {

        const key = mode ? `${path}_${mode}` : path;

        if (!this.subscriptions[key]) return;

        console.log('apagous')
        off(this.ref(path));
        delete this.subscriptions[key];
    }
}
