import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslationService } from '../../../core/services/translate.service';
import { RegisterService } from '../../../core/services/register.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default-step',
  imports: [CommonModule],
  templateUrl: './default-step.component.html',
  styleUrl: './default-step.component.scss'
})
export class DefaultStepComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showBackIcon: boolean = true;
  @Input() returnStep: number = 1;
  @Input() currentStepState: number = 1;
  @Input() btnLast: string = '';

  @Output("submit") onSubmit = new EventEmitter();
  @Output("navigate") onNavigate = new EventEmitter();

  stepOne: string = '';
  stepTwo: string = '';
  stepThree: string = '';
  tooltipBack: string = '';
  step1Image: string = '';
  step2Image: string = '';
  step3Image: string = '';
  step1TextClass: string = '';
  step2TextClass: string = '';
  step3TextClass: string = '';
  divider1Color: string = '';
  divider2Color: string = '';

  constructor(private translationService: TranslationService,
    private registerService: RegisterService,
  ) { }

  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
    this.updateStepAppearance();
  }

  loadTranslations() {
    const section = 'Register_Page';
    this.tooltipBack = this.translationService.getTranslation('tooltipBack', section);
    this.stepOne = this.translationService.getTranslation('stepOne', section);
    this.stepTwo = this.translationService.getTranslation('stepTwo', section);
    this.stepThree = this.translationService.getTranslation('stepThree', section);
  }

  private updateStepAppearance() {
    switch (this.currentStepState) {
      case 1:
        this.step1Image = 'assets/svg/icon/register/step-2/step-1-wait.svg';
        this.step2Image = 'assets/svg/icon/register/step-2/step-2-missing.svg';
        this.step3Image = 'assets/svg/icon/register/step-2/step-3-missing.svg';
        this.divider1Color = 'gray';
        this.divider2Color = 'gray';
        this.step1TextClass = 'active';
        this.step2TextClass = 'inactive';
        this.step3TextClass = 'inactive';
        break;
      case 2:
        this.step1Image = 'assets/svg/icon/register/step-2/step-1-completed.svg';
        this.step2Image = 'assets/svg/icon/register/step-2/step-2-wait.svg';
        this.step3Image = 'assets/svg/icon/register/step-2/step-3-missing.svg';
        this.divider1Color = 'blue';
        this.divider2Color = 'gray';
        this.step1TextClass = 'active';
        this.step2TextClass = 'active';
        this.step3TextClass = 'inactive';
        break;
      case 3:
        this.step1Image = 'assets/svg/icon/register/step-2/step-1-completed.svg';
        this.step2Image = 'assets/svg/icon/register/step-2/step-2-completed.svg';
        this.step3Image = 'assets/svg/icon/register/step-2/step-3-wait.svg';
        this.divider1Color = 'blue';
        this.divider2Color = 'blue';
        this.step1TextClass = 'active';
        this.step2TextClass = 'active';
        this.step3TextClass = 'active';
        break;
      case 4:
        this.step1Image = 'assets/svg/icon/register/step-2/step-1-completed.svg';
        this.step2Image = 'assets/svg/icon/register/step-2/step-2-completed.svg';
        this.step3Image = 'assets/svg/icon/register/step-2/step-3-completed.svg';
        this.divider1Color = 'blue';
        this.divider2Color = 'blue';
        this.step1TextClass = 'active';
        this.step2TextClass = 'active';
        this.step3TextClass = 'active';
        break;
    }
  }

  async return() {
    this.registerService.previousStep();
  }

  submit() {
    this.onSubmit.emit();
  }

  navigate() {
    this.onNavigate.emit();
  }
}
