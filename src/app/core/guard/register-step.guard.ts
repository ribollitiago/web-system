import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterService } from '../services/register.service';

@Injectable({
  providedIn: 'root',
})
export class RegisterStepGuard {
  constructor(
    private router: Router,
    private registerService: RegisterService
  ) {}

  canActivate(route: any): boolean {
    const requiredStep = route.data.requiredStep;
    const currentStep = this.registerService.currentStep;

    if (currentStep < requiredStep) {
      this.router.navigate(['/register']);
      return false;
    }
    return true;
  }
}
