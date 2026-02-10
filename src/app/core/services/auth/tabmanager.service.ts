import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, Subscription } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TabManagerService implements OnDestroy {
  private isVisibleSubject = new BehaviorSubject<boolean>(!document.hidden);
  public isVisible$ = this.isVisibleSubject.asObservable().pipe(shareReplay(1));
  
  private visibilitySubscription: Subscription;

  constructor() {
    this.visibilitySubscription = fromEvent(document, 'visibilitychange')
      .pipe(map(() => !document.hidden))
      .subscribe(visible => {
        this.isVisibleSubject.next(visible);
        if (visible) {
          console.log('Aba ativada: Retomando conexões...');
        } else {
          console.log('Aba em segundo plano: Pausando conexões...');
        }
      });
  }

  get isVisible(): boolean {
    return this.isVisibleSubject.value;
  }

  ngOnDestroy() {
    if (this.visibilitySubscription) {
      this.visibilitySubscription.unsubscribe();
    }
  }
}