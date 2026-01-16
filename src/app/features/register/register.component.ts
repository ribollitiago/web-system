// register.component.ts
import { Component } from '@angular/core';
import { RegisterStep1Component } from './register-step-1/register-step-1.component';
import { RegisterStep2Component } from './register-step-2/register-step-2.component';
import { RegisterStep3Component } from './register-step-3/register-step-3.component';
import { RegisterService } from '../../core/services/register.service';
import { CommonModule } from '@angular/common';
import { RegisterStep4Component } from './register-step-4/register-step-4.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RegisterStep1Component,
    RegisterStep2Component,
    RegisterStep3Component,
    RegisterStep4Component,
    CommonModule
  ],
  template: `
    <app-register-step-1 *ngIf="currentStep === 1"></app-register-step-1>
    <app-register-step-2 *ngIf="currentStep === 2"></app-register-step-2>
    <app-register-step-3 *ngIf="currentStep === 3"></app-register-step-3>
    <app-register-step-4 *ngIf="currentStep === 4"></app-register-step-4>
  `,
})
export class RegisterComponent {

  ngOnInit() {
    this.registerService.currentStep$.subscribe((step) => {
      if (step < 1 || step > 4) {
        this.registerService.setCurrentStep(1);
      }
      this.currentStep = step;
    });
  }

  currentStep: number = 1;

  constructor(private registerService: RegisterService) {
    this.registerService.currentStep$.subscribe((step) => {
      this.currentStep = step;
    });
  }

}
