import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

type Primitive = string | number | boolean;
type QueryValue = Primitive | readonly Primitive[];

export interface ApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, QueryValue>;
  withCredentials?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.backendApiUrl.replace(/\/+$/, '');

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(this.resolveUrl(path), options);
  }

  post<TRequest, TResponse>(path: string, body: TRequest, options?: ApiRequestOptions): Observable<TResponse> {
    return this.http.post<TResponse>(this.resolveUrl(path), body, options);
  }

  put<TRequest, TResponse>(path: string, body: TRequest, options?: ApiRequestOptions): Observable<TResponse> {
    return this.http.put<TResponse>(this.resolveUrl(path), body, options);
  }

  patch<TRequest, TResponse>(path: string, body: TRequest, options?: ApiRequestOptions): Observable<TResponse> {
    return this.http.patch<TResponse>(this.resolveUrl(path), body, options);
  }

  delete<TResponse>(path: string, options?: ApiRequestOptions): Observable<TResponse> {
    return this.http.delete<TResponse>(this.resolveUrl(path), options);
  }

  private resolveUrl(path: string): string {
    if (!path) return this.baseUrl;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }
}
