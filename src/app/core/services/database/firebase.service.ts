import { Injectable } from '@angular/core';
import {
    getDatabase,
    ref,
    get,
    set,
    remove,
    onValue,
    DataSnapshot,
    off
} from 'firebase/database';
import firebaseApp from '../../../firebase.config';

type Entity = {
    uid: string;
    [key: string]: any;
};

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {

    // ------------------------------------------------------
    // SEÇÃO: CONFIGURAÇÕES
    // ------------------------------------------------------

    private readonly db = getDatabase(firebaseApp);
    private usersSubscription: (() => void) | null = null;
    private userSubscription: (() => void) | null = null;
    private groupsSubscription: (() => void) | null = null;

    // ------------------------------------------------------
    // SEÇÃO: CONVERSÃO DE SNAPSHOT
    // ------------------------------------------------------

    private snapshotToUsers(snapshot: DataSnapshot): Entity[] {
        if (!snapshot.exists()) return [];
        return Object.entries(snapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as object),
        } as Entity));
    }

    // ------------------------------------------------------
    // SEÇÃO: REFERÊNCIAS DE BANCO
    // ------------------------------------------------------

    private setQueryRef(query: string) {
        return ref(this.db, query);
    }

    private async setEntity(query: string, data: Partial<Entity>) {
        const entityRef = this.setQueryRef(query);
        await set(entityRef, data);
    }

    // ------------------------------------------------------
    // SEÇÃO: LEITURA DE DADOS
    // ------------------------------------------------------

    async getAllEntity(query: string): Promise<Entity[]> {
        const snapshot = await get(this.setQueryRef(query));
        return this.snapshotToUsers(snapshot);
    }

    async getEntityField<T = any>(query: string, uid: string, field: string): Promise<T | null> {
        const snapshot = await get(this.setQueryRef(`${query}/${uid}/${field}`));
        return snapshot.exists() ? snapshot.val() as T : null;
    }

    async getEntityByField<T extends keyof Entity>(
        query: string,
        field: T,
        value: Entity[T]
    ): Promise<Entity[]> {
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
        await this.addEntity(query, data);
    }

    async addEntity(query: string, data: Record<string, any>) {
        await this.addEntity(query, data);
    }

    // ------------------------------------------------------
    // SEÇÃO: INSCRIÇÃO EM EVENTOS
    // ------------------------------------------------------

    subscribeToUser(uid: string, callback: (user: Entity | null) => void) {
        console.log()
        if (this.userSubscription) {
            this.offSubscription('user');
        }

        this.userSubscription = onValue(
            this.setQueryRef(`users/${uid}`),
            snapshot => callback(snapshot.exists() ? snapshot.val() : null)
        );
    }

    subscribeToUsers(callback: (users: Entity[]) => void) {
        if (this.usersSubscription) {
            this.offSubscription('users');
        }

        this.usersSubscription = onValue(
            this.setQueryRef('users'),
            snapshot => callback(this.snapshotToUsers(snapshot))
        );
    }

    subscribeToGroups(callback: (groups: Entity[]) => void) {
        if (this.groupsSubscription) {
            this.offSubscription('groups');
        }

        this.groupsSubscription = onValue(
            this.setQueryRef('groups'),
            snapshot => callback(this.snapshotToUsers(snapshot))
        );
    }

    // ------------------------------------------------------
    // SEÇÃO: DESINSCRIÇÃO DE EVENTOS
    // ------------------------------------------------------

    offSubscription(refPath: string) {
        off(this.setQueryRef(refPath));
        if (refPath === 'users') this.usersSubscription = null;
        if (refPath === 'user') this.userSubscription = null;
        if (refPath === 'groups') this.groupsSubscription = null;
    }
}