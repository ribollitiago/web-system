// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegisterService } from '../../core/services/components/register.service';

import { RegisterStep1Component } from './register-step-1/register-step-1.component';
import { RegisterStep2Component } from './register-step-2/register-step-2.component';
import { RegisterStep3Component } from './register-step-3/register-step-3.component';
import { RegisterStep4Component } from './register-step-4/register-step-4.component';
import { DefaultPopupComponent } from '../../shared/components/popup/default-popup/default-popup.component';
import { TranslationService } from '../../core/services/shared/translate.service';

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
    RegisterStep4Component,
    DefaultPopupComponent
  ],
  template: `
    <app-default-popup 
      title={{this.dialogTitle}}
      description={{this.dialogDescription}}
      buttonLeftTitle={{this.dialogBtnLeft}}
      buttonRightTitle={{this.dialogBtnRight}}
      buttonLeftColor={{this.popupBtnLeftColor}}
      buttonRightColor={{this.popupBtnRightColor}}
      (closeDialog)="cancelRegistration()">
    </app-default-popup>

    <app-register-step-1 *ngIf="currentStep === 1" [attr.data-key]="renderKey"></app-register-step-1>
    <app-register-step-2 *ngIf="currentStep === 2" [attr.data-key]="renderKey"></app-register-step-2>
    <app-register-step-3 *ngIf="currentStep === 3" [attr.data-key]="renderKey"></app-register-step-3>
    <app-register-step-4 *ngIf="currentStep === 4" [attr.data-key]="renderKey"></app-register-step-4>
  `
})
export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(DefaultPopupComponent) popup!: DefaultPopupComponent;

  currentStep = 1;
  renderKey = 0;
  private entityType = 'users';

  //DialogBox
  dialogTitle = '';
  dialogDescription = '';
  dialogBtnLeft = '';
  dialogBtnRight = '';

  popupBtnLeftColor = 'var(--dialog-btn-left)';
  popupBtnRightColor = 'var(--dialog-btn-right)';

  constructor(
    private registerService: RegisterService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
  ) { }

  ngOnInit(): void {
    this.registerService.resetNavigationFlag();
    this.listenSteps();

    this.listenLanguageChanges();
  }

  ngOnDestroy(): void {
    this.registerService.resetNavigationFlag();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkInitialProgress();
    }, 200);
  }

  private listenLanguageChanges(): void {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  private loadTranslations(): void {
    const section = 'register_page';
    const dialogConfirmRegister = "dialog_confirm_state.";

    this.dialogTitle = this.translationService.getTranslation(dialogConfirmRegister + 'title', section);
    this.dialogDescription = this.translationService.getTranslation(dialogConfirmRegister + 'description', section);
    this.dialogBtnLeft = this.translationService.getTranslation(dialogConfirmRegister + 'buttonLeftTitle', section);
    this.dialogBtnRight = this.translationService.getTranslation(dialogConfirmRegister + 'buttonRightTitle', section);

  }
  private listenSteps(): void {
    this.registerService.step$.subscribe(stepsMap => {
      const step = stepsMap[this.entityType] || 1;
      this.currentStep = (step < 1 || step > 4) ? 1 : step;
      this.cdr.detectChanges();
    });
  }

  private checkInitialProgress(): void {
    const entityType = 'users';
    const hasData = this.registerService.hasUserProgress(entityType);
    const isSameUser = this.registerService.isSameUser(entityType);

    if (hasData && !isSameUser) {
      this.registerService.reset(entityType);
      this.renderKey++;
      this.cdr.detectChanges();
      return;
    }

    const isInternal = this.registerService.getInternalNavigation();
    if (hasData && !isInternal) {
      if (this.popup) {
        this.popup.open();
        this.cdr.detectChanges();
      }
    }
  }

  cancelRegistration(): void {
    this.registerService.reset(this.entityType);
    this.renderKey++;
    this.currentStep = 1;
    this.cdr.detectChanges();
  }
}
