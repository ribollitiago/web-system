import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {

  private socket?: Socket;

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.api, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket.removeAllListeners();
    this.socket = undefined;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, payload?: unknown): void {
    this.socket?.emit(event, payload);
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

}
