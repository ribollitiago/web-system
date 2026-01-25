// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegisterService } from '../../core/services/auth/register.service';

import { RegisterStep1Component } from './register-step-1/register-step-1.component';
import { RegisterStep2Component } from './register-step-2/register-step-2.component';
import { RegisterStep3Component } from './register-step-3/register-step-3.component';
import { RegisterStep4Component } from './register-step-4/register-step-4.component';

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RegisterStep1Component,
    RegisterStep2Component,
    RegisterStep3Component,
    RegisterStep4Component
  ],
  template: `
    <app-register-step-1 *ngIf="currentStep === 1"></app-register-step-1>
    <app-register-step-2 *ngIf="currentStep === 2"></app-register-step-2>
    <app-register-step-3 *ngIf="currentStep === 3"></app-register-step-3>
    <app-register-step-4 *ngIf="currentStep === 4"></app-register-step-4>
  `
})
export class RegisterComponent {

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------
  currentStep = 1;

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------
  constructor(private registerService: RegisterService) { }

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    const entityType = 'users';
    this.registerService.step$.subscribe(stepsMap => {
      const step = stepsMap[entityType] || 1;

      if (step < 1 || step > 4) {
        this.registerService.setStep(entityType, 1);
        this.currentStep = 1;
        return;
      }

      this.currentStep = step;
    });
  }
}
