import { Injectable } from '@angular/core';

import { getDatabase, ref, get, set, remove, onValue, DataSnapshot, off } from 'firebase/database';
import firebaseApp from '../firebase.config';

type User = {
    uid: string;
    [key: string]: any;
};

@Injectable({
    providedIn: 'root',
})
export class FirebaseService {
    private readonly db = getDatabase(firebaseApp);
    private readonly usersRef = ref(this.db, 'users');
    private usersSubscription: (() => void) | null = null;

    // ------------------------------------------------------
    // SEÇÃO: CONEXÃO COM O FIREBASE
    // ------------------------------------------------------

    private snapshotToUsers(snapshot: DataSnapshot): User[] {
        if (!snapshot.exists()) return [];
        return Object.entries(snapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as object),
        } as User));
    }

    // ------------------------------------------------------
    // SEÇÃO: LEITURA DE DADOS
    // ------------------------------------------------------

    async getAllUsers(): Promise<User[]> {
        const snapshot = await get(this.usersRef);
        return this.snapshotToUsers(snapshot);
    }

    async getUsersByField<T extends keyof User>(field: T, value: User[T]): Promise<User[]> {
        const snapshot = await get(this.usersRef);
        const allUsers = this.snapshotToUsers(snapshot);
        return allUsers.filter(user => user[field] === value);
    }

    async getUserById(uid: string): Promise<User | null> {
        const userRef = ref(this.db, `users/${uid}`);
        const snapshot = await get(userRef);
        return snapshot.exists() ? { uid, ...snapshot.val() } : null;
    }

    // ------------------------------------------------------
    // SEÇÃO: ESCRITA DE DADOS
    // ------------------------------------------------------

    async updateUser(uid: string, data: Partial<User>) {
        const userRef = ref(this.db, `users/${uid}`);
        await set(userRef, data);
    }

    async addUser(data: Omit<User, 'uid'>, uid: string): Promise<void> {
        const userRef = ref(this.db, `users/${uid}`);
        await set(userRef, data);
    }

    async deleteUser(uid: string) {
        const userRef = ref(this.db, `users/${uid}`);
        await remove(userRef);
    }

    // ------------------------------------------------------
    // SEÇÃO: INSCRIÇÃO EM EVENTOS (para sincronizar com o Firebase)
    // ------------------------------------------------------

    subscribeToUsers(callback: (users: User[]) => void) {
        if (this.usersSubscription) {
            this.off();
        }

        this.usersSubscription = onValue(this.usersRef, (snapshot) => {
            const users = this.snapshotToUsers(snapshot);
            callback(users);
        });
    }

    // ------------------------------------------------------
    // SEÇÃO: DESINSCRIÇÃO DE EVENTOS
    // ------------------------------------------------------

    off() {
        if (this.usersSubscription) {
            off(this.usersRef);
            this.usersSubscription = null;
        }
    }
}
