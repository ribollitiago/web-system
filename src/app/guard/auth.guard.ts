import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RegisterService } from '../services/register.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private registerService: RegisterService // Inject RegisterService
  ) {}

  canActivate(): boolean {
    const token = sessionStorage.getItem('refresh-token');
    console.log('AuthGuard - Token:', token);
    if (token) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }

  canActivateRegister(requiredStepForRoute: number): boolean {
    const currentStep = this.registerService.currentStep;

    // Example validation
    if (currentStep < requiredStepForRoute) {
      this.router.navigate(['/register']); // Navigate back to the first step
      return false;
    }
    return true;
  }
}
