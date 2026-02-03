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

    // --------------------------------------------------
    // Normalização básica (remove espaços invisíveis)
    // --------------------------------------------------
    if (typeof value === 'string') {
      value = value.trim();
    }

    switch (type) {

      // --------------------------------------------------
      // NOME
      // --------------------------------------------------
      case 'NAME':

        if (!value || value.split(' ').length < 2) {
          return { valid: false, error: 'INVALID_NAME' };
        }

        const nameParts = value.split(' ');
        if (nameParts.some((part: string) => part.length < 2)) {
          return { valid: false, error: 'INVALID_NAME_PART' };
        }

        return { valid: true };

      // --------------------------------------------------
      // EMAIL
      // --------------------------------------------------
      case 'EMAIL':

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          return { valid: false, error: 'INVALID_EMAIL' };
        }

        const normalizedEmail = value.toLowerCase();

        const emailExists = await this.firebaseService.getByField(
          'users',
          'email',
          normalizedEmail
        );

        if (emailExists.length) {
          return { valid: false, error: 'EMAIL_ALREADY_EXISTS' };
        }

        return { valid: true };

      // --------------------------------------------------
      // TELEFONE
      // --------------------------------------------------
      case 'PHONE':

        if (!value) {
          return { valid: false, error: 'INVALID_PHONE' };
        }

        return { valid: true};


      // --------------------------------------------------
      // MATRÍCULA
      // --------------------------------------------------
      case 'ENROLLMENT':

        if (!value) {
          return { valid: false, error: 'ENROLLMENT_REQUIRED' };
        }

        const enrollmentExists = await this.firebaseService.getByField(
          'users',
          'enrollment',
          value
        );

        if (enrollmentExists.length) {
          return { valid: false, error: 'ENROLLMENT_ALREADY_EXISTS' };
        }

        return { valid: true };

      // --------------------------------------------------
      // SENHA
      // --------------------------------------------------
      case 'PASSWORD':

        if (!value || value.length < 6) {
          return { valid: false, error: 'PASSWORD_TOO_SHORT' };
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
        if (!passwordRegex.test(value)) {
          return { valid: false, error: 'PASSWORD_WEAK' };
        }

        if (data?.['email'] && value.toLowerCase().includes(data['email'].toLowerCase())) {
          return { valid: false, error: 'PASSWORD_CONTAINS_EMAIL' };
        }

        if (data?.['name'] && value.toLowerCase().includes(data['name'].toLowerCase())) {
          return { valid: false, error: 'PASSWORD_CONTAINS_NAME' };
        }

        return { valid: true };

      // --------------------------------------------------
      // CONFIRMAÇÃO DE SENHA
      // --------------------------------------------------
      case 'PASSWORD_MATCH':

        if (!data?.['confirmPassword']) {
          return { valid: false, error: 'CONFIRM_PASSWORD_REQUIRED' };
        }

        if (
          data?.['password'] &&
          data?.['confirmPassword'] &&
          data['password'] !== data['confirmPassword']
        ) {
          return { valid: false, error: 'PASSWORD_MISMATCH' };
        }

        return { valid: true };

      // --------------------------------------------------
      // DEFAULT
      // --------------------------------------------------
      default:
        return { valid: true };
    }
  }
}
