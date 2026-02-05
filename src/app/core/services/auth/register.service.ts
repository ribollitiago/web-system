import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseApp from '../../../firebase.config';

import { FirebaseService } from '../database/firebase.service';
import { formatDateShortBR } from '../../utils/date.utils';

// ------------------------------------------------------
// SEÇÃO: INTERFACES
// ------------------------------------------------------

export interface RegisterData {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  // ------------------------------------------------------
  // SEÇÃO: CONFIGURAÇÕES
  // ------------------------------------------------------

  private readonly MAX_STEP = 4;
  private auth = getAuth(firebaseApp);

  // ------------------------------------------------------
  // SEÇÃO: CONTROLE DE STEPS POR ENTIDADE
  // ------------------------------------------------------

  private openContinuePopupSubject = new Subject<void>();
  openContinuePopup$ = this.openContinuePopupSubject.asObservable();

  triggerContinuePopup(): void {
    this.openContinuePopupSubject.next();
  }
  private isInternalNavigation = false;

  resetNavigationFlag(): void {
    this.isInternalNavigation = false;
  }

  setInternalNavigation(value: boolean): void {
    this.isInternalNavigation = value;
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

  private stepSubject = new BehaviorSubject<{ [entityType: string]: number }>({});
  step$ = this.stepSubject.asObservable();

  getStep(entityType: string): number {
    return this.stepSubject.value[entityType] || 1;
  }

  nextStep(entityType: string): void {
    this.setInternalNavigation(true);
    const current = this.getStep(entityType);
    if (current < this.MAX_STEP) {
      this.stepSubject.next({
        ...this.stepSubject.value,
        [entityType]: current + 1
      });
    }
  }

  previousStep(entityType: string): void {
    const current = this.getStep(entityType);
    if (current > 1) {
      this.stepSubject.next({
        ...this.stepSubject.value,
        [entityType]: current - 1
      });
    }
  }

  setStep(entityType: string, step: number): void {
    if (step >= 1 && step <= this.MAX_STEP) {
      this.stepSubject.next({
        ...this.stepSubject.value,
        [entityType]: step
      });
    }
  }

  // ------------------------------------------------------
  // SEÇÃO: CONTROLE DE DADOS POR ENTIDADE
  // ------------------------------------------------------

  private dataSubject = new BehaviorSubject<{ [entityType: string]: RegisterData }>({});
  data$ = this.dataSubject.asObservable();

  updateData(entityType: string, partial: Partial<RegisterData>): void {
    const current = this.dataSubject.value[entityType] || {};
    const currentUser = getAuth().currentUser;
    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: { ...current, ...partial, savedUid: currentUser?.uid }
    });
  }

  getData(entityType: string): RegisterData {
    return this.dataSubject.value[entityType] || {};
  }

  // ------------------------------------------------------
  // SEÇÃO: RESET
  // ------------------------------------------------------

  reset(entityType: string = 'users'): void {
    const currentData = this.dataSubject.value;
    currentData[entityType] = {};
    this.dataSubject.next({ ...currentData });

    const currentSteps = this.stepSubject.value;
    currentSteps[entityType] = 1;
    this.stepSubject.next({ ...currentSteps });

    this.isInternalNavigation = false;
  }

  // ------------------------------------------------------
  // SEÇÃO: CONSTRUTOR
  // ------------------------------------------------------

  constructor(
    private firebaseService: FirebaseService
  ) { }

  // ------------------------------------------------------
  // SEÇÃO: REGISTRO
  // ------------------------------------------------------

  async register(entityType: string) {
    const data = this.getData(entityType);

    data['createdAt'] = formatDateShortBR(new Date());

    if (entityType === 'users') {
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        data['email']!,
        data['password']!
      );

      data['situation'] = 1;
      data['uid'] = credential.user.uid;

      const { password, confirmPassword, savedUid, ...entityMap } = data;
      console.log(entityMap)

      await this.firebaseService.write(
        `${entityType}/${credential.user.uid}`,
        entityMap,
        'create'
      );
    } else if (entityType === 'groups') {
      await this.firebaseService.write(
        `${entityType}/${data['key']}`,
        data,
        'create'
      );
    }

    this.reset(entityType);
  }

  // ------------------------------------------------------
  // SEÇÃO: UTILIDADES
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
}
