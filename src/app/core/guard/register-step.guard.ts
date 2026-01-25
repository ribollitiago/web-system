import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterService } from '../services/auth/register.service';

@Injectable({
  providedIn: 'root',
})
export class RegisterStepGuard {
  constructor(
    private router: Router,
    private registerService: RegisterService
  ) { }

  canActivate(route: any, entityType: string): boolean {
    const requiredStep = route.data.requiredStep;
    const currentStep = this.registerService.getStep(entityType);;

    if (currentStep < requiredStep) {
      this.router.navigate(['/register']);
      return false;
    }
    return true;
  }
}
