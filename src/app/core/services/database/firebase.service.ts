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
    DataSnapshot
} from 'firebase/database';
import firebaseApp from '../../../firebase.config';

type Entity = {
    uid?: string;
    [key: string]: any;
};

type WriteMode = 'create' | 'update' | 'set';

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

    async write(path: string, data: Entity, mode: WriteMode = 'update') {
        const reference = this.ref(path);

        if (mode === 'create') return push(reference, data);
        if (mode === 'set') return set(reference, data);

        return update(reference, data);
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

        if (this.subscriptions[path]) this.unsubscribe(path);

        onValue(this.ref(path), snapshot => {
            if (!snapshot.exists()) return callback(null);

            if (typeof snapshot.val() === 'object')
                return callback(this.snapshotToList(snapshot));

            return callback(snapshot.val());
        });

        this.subscriptions[path] = true;
    }

    unsubscribe(path: string) {
        off(this.ref(path));
        delete this.subscriptions[path];
    }
}
