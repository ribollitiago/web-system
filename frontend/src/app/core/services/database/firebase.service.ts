import { Injectable, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../backend/api.service';

type Entity = {
  uid?: string;
  [key: string]: unknown;
};

type WriteMode = 'set' | 'update' | 'push';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService implements OnDestroy {
  private readonly pollingMs = 3000;
  private readonly subscriptions = new Map<string, ReturnType<typeof setInterval>>();

  constructor(private readonly apiService: ApiService) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((intervalId) => clearInterval(intervalId));
    this.subscriptions.clear();
  }

  async write(path: string, data: Entity, mode: WriteMode): Promise<void> {
    await firstValueFrom(
      this.apiService.post<{ path: string; data: Entity; mode: WriteMode }, { success: boolean }>(
        '/firebase/write',
        { path, data, mode },
      ),
    );
  }

  async delete(path: string): Promise<void> {
    await firstValueFrom(
      this.apiService.post<{ path: string }, { success: boolean }>('/firebase/delete', { path }),
    );
  }

  async getList(path: string): Promise<Entity[]> {
    return firstValueFrom(
      this.apiService.post<{ path: string }, Entity[]>('/firebase/list', { path }),
    );
  }

  async getById(path: string): Promise<Entity | null> {
    return firstValueFrom(
      this.apiService.post<{ path: string }, Entity | null>('/firebase/by-id', { path }),
    );
  }

  async getByField(path: string, field: string, value: unknown): Promise<Entity[]> {
    return firstValueFrom(
      this.apiService.post<{ path: string; field: string; value: unknown }, Entity[]>('/firebase/by-field', {
        path,
        field,
        value,
      }),
    );
  }

  subscribe(path: string, callback: (data: Entity[]) => void): void {
    this.unsubscribe(path);

    const pull = async () => {
      const data = await this.getList(path);
      callback(data ?? []);
    };

    void pull();

    const intervalId = setInterval(() => {
      void pull();
    }, this.pollingMs);

    this.subscriptions.set(path, intervalId);
  }

  unsubscribe(path: string): void {
    const intervalId = this.subscriptions.get(path);

    if (!intervalId) {
      return;
    }

    clearInterval(intervalId);
    this.subscriptions.delete(path);
  }
}
