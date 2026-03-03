import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { ApiService } from './api.service';

interface BackendHealthResponse {
  status: string;
  timestamp?: string;
}

export interface BackendHealthState {
  online: boolean;
  checkedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class BackendHealthService {
  constructor(private readonly apiService: ApiService) {}

  checkBackend(): Observable<BackendHealthState> {
    return this.apiService.get<BackendHealthResponse>('/health').pipe(
      map((response) => ({
        online: response.status === 'ok',
        checkedAt: response.timestamp ?? new Date().toISOString(),
      })),
      catchError(() =>
        of({
          online: false,
          checkedAt: new Date().toISOString(),
        }),
      ),
    );
  }
}
