import { Injectable } from '@angular/core';

import { getDatabase, ref, get, set, remove, onValue, DataSnapshot, off } from 'firebase/database';
import firebaseApp from '../../firebase.config';

type Entity = {
    uid: string;
    [key: string]: any;
};

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
    private readonly db = getDatabase(firebaseApp);
    private usersSubscription: (() => void) | null = null;

    // ------------------------------------------------------
    // SEÇÃO: CONEXÃO COM O FIREBASE
    // ------------------------------------------------------

    private snapshotToUsers(snapshot: DataSnapshot): Entity[] {
        if (!snapshot.exists()) return [];
        return Object.entries(snapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as object),
        } as Entity));
    }

    // ------------------------------------------------------
    // SEÇÃO: FUNÇÕES AUXILIARES DE BANCO DE DADOS
    // ------------------------------------------------------

    private setQueryRef(query: string) {
        return ref(this.db, query);
    }

    private async setEntity(query: string, data: Partial<Entity>) {
        const userRef = this.setQueryRef(query);
        await set(userRef, data);
    }

    // ------------------------------------------------------
    // SEÇÃO: LEITURA DE DADOS
    // ------------------------------------------------------

    async getAllEntity(query: string): Promise<Entity[]> {
        const snapshot = await get(this.setQueryRef(query));
        return this.snapshotToUsers(snapshot);
    }

    async getEntityByField<T extends keyof Entity>(query: string, field: T, value: Entity[T]): Promise<Entity[]> {
        const allEntity = await this.getAllEntity(query);
        return allEntity.filter(entity => entity[field] === value);
    }

    async getEntityById(query: string, uid: string): Promise<Entity | null> {
        const snapshot = await get(this.setQueryRef(`${query}/${uid}`));
        return snapshot.exists() ? { uid, ...snapshot.val() } : null;
    }

    // ------------------------------------------------------
    // SEÇÃO: ESCRITA DE DADOS
    // ------------------------------------------------------

    async updateEntity(query: string, data: Record<string, any>) {
        await this.setEntity(query, data);
    }

    async addEntity(query: string, data: Record<string, any>) {
        await this.setEntity(query, data);
    }

    async deleteEntity(query: string, uid: string) {
        await remove(this.setQueryRef(`${query}/${uid}`));
    }

    // ------------------------------------------------------
    // SEÇÃO: INSCRIÇÃO EM EVENTOS (para sincronizar com o Firebase)
    // ------------------------------------------------------

    subscribeToUsers(callback: (users: Entity[]) => void) {
        if (this.usersSubscription) {
            this.off();
        }

        this.usersSubscription = onValue(this.setQueryRef('users'), (snapshot) => {
            const users = this.snapshotToUsers(snapshot);
            callback(users);
        });
    }

    // ------------------------------------------------------
    // SEÇÃO: DESINSCRIÇÃO DE EVENTOS
    // ------------------------------------------------------

    off() {
        if (this.usersSubscription) {
            off(this.setQueryRef('users'));
            this.usersSubscription = null;
        }
    }
}
