import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RegisterService } from '../services/register.service';

@Injectable({
  providedIn: 'root',
})
export class RegisterStepGuard implements CanActivate {
  constructor(
    private router: Router,
    private registerService: RegisterService
  ) {}

  canActivate(route: any): boolean {
    const requiredStep = route.data.requiredStep; // Get the required step from route data
    const currentStep = this.registerService.currentStep;

    if (currentStep < requiredStep) {
      this.router.navigate(['/register']); // Navigate back to the first step
      return false;
    }
    return true;
  }
}
