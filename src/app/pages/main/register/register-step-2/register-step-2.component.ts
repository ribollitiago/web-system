import { Component } from '@angular/core';
import { TranslationService } from '../../../../services/translate.service';
import { RegisterService } from '../../../../services/register.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-register-step-2',
  imports: [],
  templateUrl: './register-step-2.component.html',
  styleUrl: './register-step-2.component.scss'
})
export class RegisterStep2Component {
  permissionsData: any = {}; // Add form model

  title: string = '';
  subtitle: string = '';
  stepOne: string = '';
  stepTwo: string = '';
  stepThree: string = '';
  btnRegister: string = '';

  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
  }

  loadTranslations() {
    const section = 'Permissions_Page';
    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);

    const section2 = 'Register_Page';
    this.stepOne = this.translationService.getTranslation('stepOne', section2);
    this.stepTwo = this.translationService.getTranslation('stepTwo', section2);
    this.stepThree = this.translationService.getTranslation('stepThree', section2);
    this.btnRegister = this.translationService.getTranslation('btnRegister', section2);
  }

  async submit() {
    try {
      // Mark Step 2 as completed
      this.registerService.setStep2Completed({});
      // Navigate to Step 3
      this.router.navigate(['/register/permissions/resume']);
    } catch (error) {
      console.error('Error navigating to Step 3:', error);
    }
  }
}
