import { Injectable } from '@angular/core';
import { RegisterData } from '../components/register.service';
import { FirebaseService } from '../database/firebase.service';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidatorsService {

  // ------------------------------------------------------
  // START CONSTRUCTOR
  // ------------------------------------------------------

  constructor(
    private firebaseService: FirebaseService
  ) { }

  // ------------------------------------------------------
  // START VALIDATION
  // ------------------------------------------------------

  async validate(
    type: string,
    value?: any,
    data?: RegisterData
  ): Promise<ValidationResult> {

    if (typeof value === 'string') {
      value = value.trim();
    }

    switch (type) {

      // ---------------- NAME ----------------
      case 'NAME':
        return this.validateName(value);

      // ---------------- EMAIL ----------------
      case 'EMAIL':
        return this.validateEmail(value);

      // ---------------- PHONE ----------------
      case 'PHONE':
        return this.validatePhone(value);

      // ---------------- ENROLLMENT ----------------
      case 'ENROLLMENT':
        return this.validateEnrollment(value);

      // ---------------- PASSWORD ----------------
      case 'PASSWORD':
        return this.validatePassword(value, data);

      // ---------------- PASSWORD MATCH ----------------
      case 'PASSWORD_MATCH':
        return this.validatePasswordMatch(data);

      default:
        return { valid: true };
    }
  }

  // ------------------------------------------------------
  // START VALIDATION RULES
  // ------------------------------------------------------

  private validateName(value: string): ValidationResult {

    if (!value) {
      return { valid: false, error: 'EMPTY_NAME' };
    }

    if (value.split(' ').length < 2) {
      return { valid: false, error: 'INVALID_NAME' };
    }

    const nameParts = value.split(' ');

    if (nameParts.some(part => part.length < 2)) {
      return { valid: false, error: 'INVALID_NAME_PART' };
    }

    return { valid: true };
  }

  private async validateEmail(value: string): Promise<ValidationResult> {

    if (!value) {
      return { valid: false, error: 'EMPTY_EMAIL' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
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
  }

  private validatePhone(value: string): ValidationResult {

    if (!value) {
      return { valid: false, error: 'EMPTY_PHONE' };
    }

    if (value.length < 14) {
      return { valid: false, error: 'PHONE_TOO_SHORT'}
    }
    return { valid: true };
  }

  private async validateEnrollment(value: string): Promise<ValidationResult> {

    if (!value) {
      return { valid: false, error: 'EMPTY_ENROLLMENT' };
    }

    const exists = await this.firebaseService.getByField(
      'users',
      'enrollment',
      value
    );

    if (exists.length) {
      return { valid: false, error: 'ENROLLMENT_ALREADY_EXISTS' };
    }

    return { valid: true };
  }

  private validatePassword(
    value: string,
    data?: RegisterData
  ): ValidationResult {

    if (!value) {
      return { valid: false, error: 'EMPTY_PASSWORD' };
    }

    if (value.length < 6) {
      return { valid: false, error: 'PASSWORD_TOO_SHORT' };
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;

    if (!passwordRegex.test(value)) {
      return { valid: false, error: 'PASSWORD_WEAK' };
    }

    if (data?.['email'] &&
      value.toLowerCase().includes(data['email'].toLowerCase())) {
      return { valid: false, error: 'PASSWORD_CONTAINS_EMAIL' };
    }

    if (data?.['name'] &&
      value.toLowerCase().includes(data['name'].toLowerCase())) {
      return { valid: false, error: 'PASSWORD_CONTAINS_NAME' };
    }

    return { valid: true };
  }

  private validatePasswordMatch(
    data?: RegisterData
  ): ValidationResult {

    if (!data?.['confirmPassword']) {
      return { valid: false, error: 'EMPTY_CONFIRMPASSWORD' };
    }

    if (
      data?.['password'] &&
      data?.['confirmPassword'] &&
      data['password'] !== data['confirmPassword']
    ) {
      return { valid: false, error: 'PASSWORD_MISMATCH' };
    }

    return { valid: true };
  }
}
