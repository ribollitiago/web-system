import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { getAuth, createUserWithEmailAndPassword, User } from 'firebase/auth';
import firebaseApp from '../../firebase.config';

import { FirebaseService } from './firebase.service';


// ======================================================
// INTERFACES
// ======================================================

export interface RegisterData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  enrollment?: string;
  password?: string;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  // ======================================================
  // CONFIGURAÇÕES
  // ======================================================

  private readonly MAX_STEP = 4;
  private auth = getAuth(firebaseApp);


  // ======================================================
  // CONTROLE DE STEPS
  // ======================================================

  private stepSubject = new BehaviorSubject<number>(1);

  step$ = this.stepSubject.asObservable();

  get currentStep(): number {
    return this.stepSubject.value;
  }

  nextStep(): void {
    if (this.currentStep < this.MAX_STEP) {
      this.stepSubject.next(this.currentStep + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.stepSubject.next(this.currentStep - 1);
    }
  }

  setStep(step: number): void {
    if (step >= 1 && step <= this.MAX_STEP) {
      this.stepSubject.next(step);
    }
  }


  // ======================================================
  // CONTROLE DE DADOS DO REGISTRO
  // ======================================================

  private dataSubject = new BehaviorSubject<RegisterData>({});
  data$ = this.dataSubject.asObservable();

  updateData(partial: Partial<RegisterData>): void {
    this.dataSubject.next({
      ...this.dataSubject.value,
      ...partial
    });
  }

  getData(): RegisterData {
    return this.dataSubject.value;
  }


  // ======================================================
  // RESET GERAL
  // ======================================================

  reset(): void {
    this.dataSubject.next({});
    this.stepSubject.next(1);
  }


  // ======================================================
  // CONSTRUTOR
  // ======================================================

  constructor(
    private firebaseService: FirebaseService
  ) { }


  // ======================================================
  // VALIDAÇÕES DE FORMULÁRIO (FRONT-END)
  // ======================================================

  async validate(
    type: string,
    value?: any,
    data?: RegisterData
  ): Promise<ValidationResult> {

    switch (type) {

      case 'NAME':
        if (!value || value.trim().split(' ').length < 2) {
          return { valid: false, error: 'INVALID_NAME' };
        }
        return { valid: true };

      case 'EMAIL':
        if (!value || !value.includes('@')) {
          return { valid: false, error: 'INVALID_EMAIL' };
        }

        const emailExists = await this.firebaseService.getEntityByField(
          'users',
          'email',
          value
        );

        if (emailExists.length) {
          return { valid: false, error: 'EMAIL_ALREADY_EXISTS' };
        }

        return { valid: true };

      case 'PHONE':
        if (!value) {
          return { valid: false, error: 'INVALID_PHONE' };
        }
        return { valid: true };

      case 'ENROLLMENT':
        if (!value) {
          return { valid: false, error: 'ENROLLMENT_REQUIRED' };
        }

        const enrollmentExists = await this.firebaseService.getEntityByField(
          'users',
          'enrollment',
          value
        );

        if (enrollmentExists.length) {
          return { valid: false, error: 'ENROLLMENT_ALREADY_EXISTS' };
        }

        return { valid: true };

      case 'PASSWORD':
        if (!value || value.length < 6) {
          return { valid: false, error: 'PASSWORD_TOO_SHORT' };
        }
        return { valid: true };

      case 'PASSWORD_MATCH':
        if (!data?.password || data.password !== data['confirmPassword']) {
          return { valid: false, error: 'PASSWORD_MISMATCH' };
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  }

  // ======================================================
  // REGISTRO FINAL
  // ======================================================

  async register() {

    const data = this.getData();

    data.id = await this.generateNextUserId();

    const credential = await createUserWithEmailAndPassword(
      this.auth,
      data.email!,
      data.password!
    );

    const { password, ...userMap } = data;

    await this.firebaseService.addEntity(
      `users/${credential.user.uid}`,
      userMap
    );

    this.reset();
  }


  // ======================================================
  // UTILIDADES
  // ======================================================

  private async generateNextUserId(): Promise<string> {
    const users = await this.firebaseService.getAllEntity('users');

    if (!users.length) return '00001';

    const maxId = Math.max(
      ...users.map(u => Number(u['id'] ?? 0))
    );

    return String(maxId + 1).padStart(5, '0');
  }

}
