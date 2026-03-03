import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from '../database/firebase.service';
import { GroupsService, Group } from '../components/groups.service';

export interface Session {
    isOnline?: boolean;
    blocked?: boolean;
    lastLogin?: string;
    device?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    date: string;
    phone: string;
    enrollment: string;
    description: string;
    permissions: string[];
    groups: Group[];
    session?: Session;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UsersService {

    private usersSubject = new BehaviorSubject<User[]>([]);
    users$ = this.usersSubject.asObservable();

    private users: User[] = [];

    constructor(
        private firebaseService: FirebaseService,
        private groupsService: GroupsService
    ) { }

    // ------------------------------------------------------
    // REALTIME SUBSCRIBE
    // ------------------------------------------------------

    async subscribe(): Promise<void> {

        const groups = await this.groupsService.getGroupsOnce();

        this.firebaseService.subscribe('users', (rawUsers: any[]) => {

            this.users = this.mapUsers(rawUsers || [], groups);
            this.usersSubject.next(this.users);
        });
    }

    unSubscribe(): void {
        this.firebaseService.unsubscribe('users');
    }

    async getUsersOnce(): Promise<User[]> {

        const rawUsers = await this.firebaseService.getList('users') ?? [];
        const groups = await this.groupsService.getGroupsOnce();

        return this.mapUsers(rawUsers, groups);
    }

    getUsers(): readonly User[] {
        return this.users;
    }

    // ------------------------------------------------------
    // MAPPERS
    // ------------------------------------------------------

    private mapUsers(rawUsers: any[], groups: Group[]): User[] {

        return rawUsers.map(rawUser => {

            const userGroups = this.resolveGroups(rawUser.groups, groups);

            return {
                id: rawUser.id,
                name: rawUser.name || '',
                email: rawUser.email || '',
                date: rawUser.date || '',
                phone: rawUser.phone || '',
                enrollment: rawUser.enrollment || '',
                description: rawUser.description || '',
                permissions: rawUser.permissions ?? [],
                groups: userGroups,
                session: rawUser.session || {},
                createdAt: rawUser.createdAt
            };
        });
    }

    private resolveGroups(userGroupIds: string[], allGroups: Group[]): Group[] {

        if (!Array.isArray(userGroupIds)) return [];

        return userGroupIds
            .map(id => allGroups.find(g => g.id === id))
            .filter((g): g is Group => !!g);
    }
}