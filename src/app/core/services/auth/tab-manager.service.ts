import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TabManagerService implements OnDestroy {

  // ------------------------------------------------------
  // SESSÃO: STATE - VISIBILITY
  // ------------------------------------------------------

  private isVisibleSubject = new BehaviorSubject<boolean>(!document.hidden);
  public isVisible$ = this.isVisibleSubject.asObservable().pipe(shareReplay(1));

  // ------------------------------------------------------
  // SESSÃO: STATE - MASTER CONTROL
  // ------------------------------------------------------

  private isMaster = false;
  private masterAliveTimeout?: ReturnType<typeof setTimeout>;
  private masterHeartbeat?: ReturnType<typeof setInterval>;

  // ------------------------------------------------------
  // SESSÃO: BROADCAST
  // ------------------------------------------------------

  private broadcastChannel?: BroadcastChannel;
  private isMasterSubject = new BehaviorSubject<boolean>(false);
  public isMaster$ = this.isMasterSubject.asObservable().pipe(shareReplay(1));

  // ------------------------------------------------------
  // SESSÃO: SUBSCRIPTIONS
  // ------------------------------------------------------

  private visibilitySubscription: Subscription;

  // ------------------------------------------------------
  // SESSÃO: LIFECYCLE HANDLERS
  // ------------------------------------------------------

  private unloadHandler = () => this.loseMaster();

  // ------------------------------------------------------
  // SESSÃO: CONSTRUCTOR
  // ------------------------------------------------------

  constructor() {

    // -----------------------------
    // Browser lifecycle
    // -----------------------------
    window.addEventListener('beforeunload', this.unloadHandler);

    // -----------------------------
    // Broadcast setup
    // -----------------------------
    this.initializeBroadcast();

    // -----------------------------
    // Visibility observer
    // -----------------------------
    this.visibilitySubscription = fromEvent(document, 'visibilitychange')
      .pipe(map(() => !document.hidden))
      .subscribe(visible => this.handleVisibilityChange(visible));
  }

  // ------------------------------------------------------
  // SESSÃO: GETTERS
  // ------------------------------------------------------

  get isVisible(): boolean {
    return this.isVisibleSubject.value;
  }

  get master(): boolean {
    return this.isMaster;
  }

  // ------------------------------------------------------
  // SESSÃO: BROADCAST INIT
  // ------------------------------------------------------

  private initializeBroadcast() {
    if (!('BroadcastChannel' in window)) return;

    this.broadcastChannel = new BroadcastChannel('tab-sync-channel');

    this.broadcastChannel.onmessage = (event) => {
      this.handleBroadcastMessage(event.data);
    };

    this.sendHello();
    this.startMasterCheck();
  }

  // ------------------------------------------------------
  // SESSÃO: VISIBILITY CONTROL
  // ------------------------------------------------------

  private handleVisibilityChange(visible: boolean) {
    this.isVisibleSubject.next(visible);

    if (visible) {
      console.log('Aba ativada');
      this.sendHello();
      this.startMasterCheck();
      return;
    }

    console.log('Aba hidden');
    this.loseMaster();
  }

  // ------------------------------------------------------
  // SESSÃO: BROADCAST MESSAGE HANDLER
  // ------------------------------------------------------

  private handleBroadcastMessage(message: any) {

    switch (message.type) {

      case 'HELLO':
        if (this.isMaster) {
          this.sendMasterAlive();
          this.broadcastChannel?.postMessage({ type: 'MASTER_PRESENT' });
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

        if (this.isMaster) {
          this.loseMaster();
        }
        break;
    }
  }

  // ------------------------------------------------------
  // SESSÃO: MASTER CONTROL
  // ------------------------------------------------------

  private becomeMaster() {
    if (this.isMaster || !this.isVisible) return;

    this.isMaster = true;
    this.isMasterSubject.next(true);

    console.log('🔥 ESTA ABA VIROU MASTER');

    this.broadcastChannel?.postMessage({ type: 'MASTER_CLAIM' });
    this.startHeartbeat();
  }

  private loseMaster() {
    if (!this.isMaster) return;

    console.log('❌ ESTA ABA PERDEU MASTER');

    this.broadcastChannel?.postMessage({ type: 'MASTER_RELEASED' });

    this.isMaster = false;
    this.isMasterSubject.next(false);

    if (this.masterHeartbeat) {
      clearInterval(this.masterHeartbeat);
      this.masterHeartbeat = undefined;
    }

    this.resetMasterTimeout();
  }


  // ------------------------------------------------------
  // SESSÃO: MASTER HEARTBEAT
  // ------------------------------------------------------

  private startHeartbeat() {
    this.masterHeartbeat = setInterval(() => {

      if (!this.isVisible) return;

      this.sendMasterAlive();

    }, 2000);
  }

  // ------------------------------------------------------
  // SESSÃO: MASTER ELECTION
  // ------------------------------------------------------

  private startMasterCheck() {

    this.resetMasterTimeout();

    this.masterAliveTimeout = setTimeout(() => {
      this.becomeMaster();
    }, 1000);
  }

  private resetMasterTimeout() {
    if (!this.masterAliveTimeout) return;

    clearTimeout(this.masterAliveTimeout);
    this.masterAliveTimeout = undefined;
  }

  // ------------------------------------------------------
  // SESSÃO: BROADCAST SEND HELPERS
  // ------------------------------------------------------

  private sendHello() {
    this.broadcastChannel?.postMessage({ type: 'HELLO' });
  }

  private sendMasterAlive() {
    this.broadcastChannel?.postMessage({ type: 'MASTER_ALIVE' });
  }

  // ------------------------------------------------------
  // SESSÃO: DESTROY
  // ------------------------------------------------------

  ngOnDestroy() {

    this.visibilitySubscription?.unsubscribe();

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    if (this.masterHeartbeat) {
      clearInterval(this.masterHeartbeat);
    }

    if (this.masterAliveTimeout) {
      clearTimeout(this.masterAliveTimeout);
    }

    window.removeEventListener('beforeunload', this.unloadHandler);
  }
}