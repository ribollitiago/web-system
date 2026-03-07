import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {

    private API = environment.api;

    constructor(private http: HttpClient) { }

    // -----------------------
    // LOGIN
    // -----------------------

    login(email: string, password: string, device?: string) {
        return this.http.post(`${this.API}/auth/login`, {
            email,
            password,
            device
        });
    }

    logout() {
        return firstValueFrom(
            this.http.post(`${this.API}/auth/logout`, {}, this.withAuth()),
        );
    }

    logoutAll() {
        return firstValueFrom(
            this.http.post(`${this.API}/auth/logout-all`, {}, this.withAuth()),
        );
    }

    // -----------------------
    // GET LIST
    // -----------------------

    async getList(path: string) {
        return firstValueFrom(
            this.http.get(`${this.API}/${path}`, this.withAuth())
        );
    }

    // -----------------------
    // GET BY ID
    // -----------------------

    async getById(path: string, id: number | string) {
        return firstValueFrom(
            this.http.get(`${this.API}/${path}/${id}`, this.withAuth())
        );
    }

    // -----------------------
    // CREATE
    // -----------------------

    async create(path: string, data: any) {
        return firstValueFrom(
            this.http.post(`${this.API}/${path}`, data, this.withAuth())
        );
    }

    // -----------------------
    // UPDATE
    // -----------------------

    async update(path: string, id: number | string, data: any) {
        return firstValueFrom(
            this.http.patch(`${this.API}/${path}/${id}`, data, this.withAuth())
        );
    }

    // -----------------------
    // DELETE
    // -----------------------

    async delete(path: string, id: number | string) {
        return firstValueFrom(
            this.http.delete(`${this.API}/${path}/${id}`, this.withAuth())
        );
    }

    private withAuth() {
        const token = localStorage.getItem('access-token');

        if (!token) {
            return {};
        }

        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${token}`,
            }),
        };
    }
}
