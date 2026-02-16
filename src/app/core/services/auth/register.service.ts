import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseApp from '../../../firebase.config';

import { FirebaseService } from '../database/firebase.service';
import { formatDateShortBR } from '../../utils/date.utils';

export interface RegisterData {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  // ------------------------------------------------------
  // CONSTANTS
  // ------------------------------------------------------

  private readonly MAX_STEP = 4;
  private readonly auth = getAuth(firebaseApp);

  // ------------------------------------------------------
  // STREAMS
  // ------------------------------------------------------

  private openContinuePopupSubject = new Subject<void>();
  public readonly openContinuePopup$ = this.openContinuePopupSubject.asObservable();

  private stepSubject = new BehaviorSubject<Record<string, number>>({});
  public readonly step$ = this.stepSubject.asObservable();

  private dataSubject = new BehaviorSubject<Record<string, RegisterData>>({});
  public readonly data$ = this.dataSubject.asObservable();

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------

  private isInternalNavigation = false;

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------

  constructor(
    private firebaseService: FirebaseService
  ) {}

  // ------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------

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
    const currentUser = this.auth.currentUser;

    if (!data['savedUid'] || !currentUser) return true;

    return data['savedUid'] === currentUser.uid;
  }

  // ------------------------------------------------------
  // STEP CONTROL
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // DATA CONTROL
  // ------------------------------------------------------

  updateData(entityType: string, partial: Partial<RegisterData>): void {

    const current = this.getData(entityType);
    const currentUser = this.auth.currentUser;

    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: {
        ...current,
        ...partial,
        savedUid: currentUser?.uid
      }
    });
  }

  getData(entityType: string): RegisterData {
    return this.dataSubject.value[entityType] || {};
  }

  // ------------------------------------------------------
  // RESET
  // ------------------------------------------------------

  reset(entityType: string = 'users'): void {

    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: {}
    });

    this.stepSubject.next({
      ...this.stepSubject.value,
      [entityType]: 1
    });

    this.isInternalNavigation = false;
  }

  // ------------------------------------------------------
  // REGISTER FLOW
  // ------------------------------------------------------

  async register(entityType: string): Promise<void> {

    const data = { ...this.getData(entityType) };

    data['createdAt'] = this.buildTimestamp();

    if (entityType === 'users') {

      const credential = await createUserWithEmailAndPassword(
        this.auth,
        data['email'],
        data['password']
      );

      data['situation'] = 1;
      data['uid'] = credential.user.uid;

      const { password, confirmPassword, savedUid, ...entityMap } = data;

      await this.firebaseService.write(
        `${entityType}/${credential.user.uid}`,
        entityMap,
        'set'
      );

    } else if (entityType === 'groups') {

      await this.firebaseService.write(
        `${entityType}/${data['key']}`,
        data,
        'set'
      );
    }

    this.reset(entityType);
  }

  // ------------------------------------------------------
  // UTILITIES
  // ------------------------------------------------------

  hasUserProgress(entityType: string): boolean {

    const data = this.getData(entityType);

    if (!data) return false;

    return Boolean(
      data['name'] ||
      data['email'] ||
      data['phone'] ||
      data['enrollment'] ||
      data['password'] ||
      data['confirmPassword']
    );
  }

  // ------------------------------------------------------
  // PRIVATE HELPERS
  // ------------------------------------------------------

  private updateStep(entityType: string, step: number): void {

    this.stepSubject.next({
      ...this.stepSubject.value,
      [entityType]: step
    });
  }

  private buildTimestamp(): string {
    return formatDateShortBR(new Date());
  }
}