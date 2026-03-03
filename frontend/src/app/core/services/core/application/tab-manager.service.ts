import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

type BroadcastMessage =
  | { type: 'HELLO' }
  | { type: 'MASTER_PRESENT' }
  | { type: 'MASTER_ALIVE' }
  | { type: 'MASTER_CLAIM' }
  | { type: 'MASTER_RELEASED' };

@Injectable({
  providedIn: 'root'
})
export class TabManagerService implements OnDestroy {

  // ------------------------------------------------------
  // CONSTANTS
  // ------------------------------------------------------

  private readonly CHANNEL_NAME = 'tab-sync-channel';
  private readonly MASTER_CHECK_DELAY = 1000;
  private readonly HEARTBEAT_INTERVAL = 2000;

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------

  private isMaster = false;

  private masterAliveTimeout?: ReturnType<typeof setTimeout>;
  private masterHeartbeat?: ReturnType<typeof setInterval>;

  private broadcastChannel?: BroadcastChannel;

  // ------------------------------------------------------
  // STREAM STATE
  // ------------------------------------------------------

  private isVisibleSubject = new BehaviorSubject<boolean>(!document.hidden);
  public readonly isVisible$ = this.isVisibleSubject.asObservable().pipe(shareReplay(1));

  private isMasterSubject = new BehaviorSubject<boolean>(false);
  public readonly isMaster$ = this.isMasterSubject.asObservable().pipe(shareReplay(1));

  // ------------------------------------------------------
  // SUBSCRIPTIONS
  // ------------------------------------------------------

  private visibilitySubscription: Subscription;

  // ------------------------------------------------------
  // LIFECYCLE HANDLERS
  // ------------------------------------------------------

  private readonly unloadHandler = () => this.loseMaster();

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------

  constructor() {

    window.addEventListener('beforeunload', this.unloadHandler);

    this.initializeBroadcast();

    this.visibilitySubscription = fromEvent(document, 'visibilitychange')
      .pipe(map(() => !document.hidden))
      .subscribe(visible => this.handleVisibilityChange(visible));
  }

  // ------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------

  get isVisible(): boolean {
    return this.isVisibleSubject.value;
  }

  get master(): boolean {
    return this.isMaster;
  }

  // ------------------------------------------------------
  // VISIBILITY CONTROL
  // ------------------------------------------------------

  private handleVisibilityChange(visible: boolean): void {

    this.isVisibleSubject.next(visible);

    if (visible) {
      this.sendHello();
      this.startMasterCheck();
      return;
    }

    this.loseMaster();
  }

  // ------------------------------------------------------
  // MASTER CONTROL
  // ------------------------------------------------------

  private becomeMaster(): void {

    if (this.isMaster || !this.isVisible) return;

    this.isMaster = true;
    this.isMasterSubject.next(true);

    this.broadcast({ type: 'MASTER_CLAIM' });

    this.startHeartbeat();
  }

  private loseMaster(): void {

    if (!this.isMaster) return;

    this.broadcast({ type: 'MASTER_RELEASED' });

    this.isMaster = false;
    this.isMasterSubject.next(false);

    this.clearHeartbeat();
    this.resetMasterTimeout();
  }

  // ------------------------------------------------------
  // BROADCAST SETUP
  // ------------------------------------------------------

  private initializeBroadcast(): void {

    if (!('BroadcastChannel' in window)) return;

    this.broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME);

    this.broadcastChannel.onmessage = (event) => {
      this.handleBroadcastMessage(event.data as BroadcastMessage);
    };

    this.sendHello();
    this.startMasterCheck();
  }

  private handleBroadcastMessage(message: BroadcastMessage): void {

    switch (message.type) {

      case 'HELLO':
        if (this.isMaster) {
          this.sendMasterAlive();
          this.broadcast({ type: 'MASTER_PRESENT' });
        }
        break;

      case 'MASTER_RELEASED':
        this.startMasterCheck();
        break;

      case 'MASTER_ALIVE':
        this.resetMasterTimeout();
        break;

      case 'MASTER_CLAIM':
        this.resetMasterTimeout();
        if (this.isMaster) this.loseMaster();
        break;
    }
  }

  // ------------------------------------------------------
  // MASTER HEARTBEAT
  // ------------------------------------------------------

  private startHeartbeat(): void {

    this.clearHeartbeat();

    this.masterHeartbeat = setInterval(() => {

      if (!this.isVisible) return;

      this.sendMasterAlive();

    }, this.HEARTBEAT_INTERVAL);
  }

  private clearHeartbeat(): void {

    if (!this.masterHeartbeat) return;

    clearInterval(this.masterHeartbeat);
    this.masterHeartbeat = undefined;
  }

  // ------------------------------------------------------
  // MASTER ELECTION
  // ------------------------------------------------------

  private startMasterCheck(): void {

    this.resetMasterTimeout();

    this.masterAliveTimeout = setTimeout(() => {
      this.becomeMaster();
    }, this.MASTER_CHECK_DELAY);
  }

  private resetMasterTimeout(): void {

    if (!this.masterAliveTimeout) return;

    clearTimeout(this.masterAliveTimeout);
    this.masterAliveTimeout = undefined;
  }

  // ------------------------------------------------------
  // BROADCAST HELPERS
  // ------------------------------------------------------

  private broadcast(message: BroadcastMessage): void {
    this.broadcastChannel?.postMessage(message);
  }

  private sendHello(): void {
    this.broadcast({ type: 'HELLO' });
  }

  private sendMasterAlive(): void {
    this.broadcast({ type: 'MASTER_ALIVE' });
  }

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------

  ngOnDestroy(): void {

    this.visibilitySubscription?.unsubscribe();

    this.broadcastChannel?.close();

    this.clearHeartbeat();
    this.resetMasterTimeout();

    window.removeEventListener('beforeunload', this.unloadHandler);
  }
}