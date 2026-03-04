import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';

import { FirebaseService } from '../database/firebase.service';
import { formatDateShortBR } from '../../utils/date.utils';
import { ApiService } from '../backend/api.service';
import { SessionService } from '../core/session/session.service';

export interface RegisterData {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private readonly MAX_STEP = 4;

  private openContinuePopupSubject = new Subject<void>();
  public readonly openContinuePopup$ = this.openContinuePopupSubject.asObservable();

  private stepSubject = new BehaviorSubject<Record<string, number>>({});
  public readonly step$ = this.stepSubject.asObservable();

  private dataSubject = new BehaviorSubject<Record<string, RegisterData>>({});
  public readonly data$ = this.dataSubject.asObservable();

  private isInternalNavigation = false;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly apiService: ApiService,
    private readonly sessionService: SessionService,
  ) {}

  triggerContinuePopup(): void {
    this.openContinuePopupSubject.next();
  }

  setInternalNavigation(value: boolean): void {
    this.isInternalNavigation = value;
  }

  resetNavigationFlag(): void {
    this.isInternalNavigation = false;
  }

  getInternalNavigation(): boolean {
    const val = this.isInternalNavigation;
    this.isInternalNavigation = false;
    return val;
  }

  isSameUser(entityType: string): boolean {
    const data = this.getData(entityType);
    const currentUser = this.sessionService.getCurrentAuthUser();

    if (!data['savedUid'] || !currentUser) return true;

    return data['savedUid'] === currentUser.uid;
  }

  getStep(entityType: string): number {
    return this.stepSubject.value[entityType] || 1;
  }

  nextStep(entityType: string): void {
    this.setInternalNavigation(true);

    const current = this.getStep(entityType);

    if (current >= this.MAX_STEP) return;

    this.updateStep(entityType, current + 1);
  }

  previousStep(entityType: string): void {
    const current = this.getStep(entityType);

    if (current <= 1) return;

    this.updateStep(entityType, current - 1);
  }

  setStep(entityType: string, step: number): void {
    if (step < 1 || step > this.MAX_STEP) return;

    this.updateStep(entityType, step);
  }

  updateData(entityType: string, partial: Partial<RegisterData>): void {
    const current = this.getData(entityType);
    const currentUser = this.sessionService.getCurrentAuthUser();

    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: {
        ...current,
        ...partial,
        savedUid: currentUser?.uid,
      },
    });
  }

  getData(entityType: string): RegisterData {
    return this.dataSubject.value[entityType] || {};
  }

  reset(entityType: string = 'users'): void {
    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: {},
    });

    this.stepSubject.next({
      ...this.stepSubject.value,
      [entityType]: 1,
    });

    this.isInternalNavigation = false;
  }

  async register(entityType: string): Promise<void> {
    const data = { ...this.getData(entityType) };

    data['createdAt'] = this.buildTimestamp();

    if (entityType === 'users') {
      const { confirmPassword, savedUid, ...payload } = data;

      await firstValueFrom(
        this.apiService.post<Record<string, unknown>, { uid: string }>('/auth/register-user', {
          ...payload,
          email: String(payload['email'] ?? '').toLowerCase(),
        }),
      );
    } else if (entityType === 'groups') {
      await this.firebaseService.write(`${entityType}/${String(data['key'] ?? '')}`, data, 'set');
    }

    this.reset(entityType);
  }

  hasUserProgress(entityType: string): boolean {
    const data = this.getData(entityType);

    if (!data) return false;

    return Boolean(
      data['name'] ||
      data['email'] ||
      data['phone'] ||
      data['enrollment'] ||
      data['password'] ||
      data['confirmPassword'],
    );
  }

  private updateStep(entityType: string, step: number): void {
    this.stepSubject.next({
      ...this.stepSubject.value,
      [entityType]: step,
    });
  }

  private buildTimestamp(): string {
    return formatDateShortBR(new Date());
  }
}
