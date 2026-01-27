import { Injectable } from '@angular/core';
import { RegisterData } from '../auth/register.service';
import { FirebaseService } from '../database/firebase.service';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidatorsService {

  constructor(
    private firebaseService: FirebaseService
  ) { }

  // ------------------------------------------------------
  // SEÇÃO: VALIDAÇÃO
  // ------------------------------------------------------

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
        if (
          data?.['password'] &&
          data?.['confirmPassword'] &&
          data['password'] !== data['confirmPassword']
        ) {
          return { valid: false, error: 'PASSWORD_MISMATCH' };
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  }
}
