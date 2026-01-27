import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  private stepSubject = new BehaviorSubject<{ [entityType: string]: number }>({});
  step$ = this.stepSubject.asObservable();

  getStep(entityType: string): number {
    return this.stepSubject.value[entityType] || 1;
  }

  nextStep(entityType: string): void {
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
    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: {
        ...current,
        ...partial
      }
    });
  }

  getData(entityType: string): RegisterData {
    return this.dataSubject.value[entityType] || {};
  }

  // ------------------------------------------------------
  // SEÇÃO: RESET
  // ------------------------------------------------------

  reset(entityType?: string): void {
    if (entityType) {
      this.dataSubject.next({
        ...this.dataSubject.value,
        [entityType]: {}
      });
      this.stepSubject.next({
        ...this.stepSubject.value,
        [entityType]: 1
      });
    } else {
      this.dataSubject.next({});
      this.stepSubject.next({});
    }
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
    data['situation'] = 0;

    if (entityType === 'users') {
      data['id'] = await this.generateNextId(entityType);
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        data['email']!,
        data['password']!
      );

      const { password, confirmPassword, ...entityMap } = data;

      await this.firebaseService.addEntity(
        `${entityType}/${credential.user.uid}`,
        entityMap
      );
    } else if (entityType === 'groups') {
      await this.firebaseService.addEntity(
        `${entityType}/${data['key']}`,
        data
      );
    }

    this.reset(entityType);
  }

  // ------------------------------------------------------
  // SEÇÃO: UTILIDADES
  // ------------------------------------------------------

  private async generateNextId(entityType: string): Promise<string> {
    const entities = await this.firebaseService.getAllEntity(entityType);
    if (!entities.length) return '00001';

    const maxId = Math.max(...entities.map(e => Number(e['id'] ?? 0)));
    return String(maxId + 1).padStart(5, '0');
  }
}
