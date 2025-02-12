import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../../../services/translate.service';
import { RegisterService } from '../../../../services/register.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-step-3',
  imports: [],
  templateUrl: './register-step-3.component.html',
  styleUrl: './register-step-3.component.scss'
})
export class RegisterStep3Component implements OnInit{
  isLoading = false;
  registrationData: any = {};

  title: string = '';
  subtitle: string = '';
  stepOne: string = '';
  stepTwo: string = '';
  stepThree: string = '';
  btnRegister: string = '';

  constructor(
    private translationService: TranslationService,
    private regService: RegisterService,
    private router: Router
  ) { }

  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();

    if (!this.regService.isStep2Completed()) {
      this.router.navigate(['/register/permissions']); // Redirect to Step 2 if not completed
    }
  }

  loadTranslations() {
    const section = 'Resume_Page';
    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);
    this.btnRegister = this.translationService.getTranslation('btnRegister', section);

    const section2 = 'Register_Page';
    this.stepOne = this.translationService.getTranslation('stepOne', section2);
    this.stepTwo = this.translationService.getTranslation('stepTwo', section2);
    this.stepThree = this.translationService.getTranslation('stepThree', section2);
  }

  confirmRegistration() {
    this.regService.registerUser().then(() => {
      // Redirect to home/dashboard
      this.router.navigate(['/home']);
    }).catch(error => {
      // Handle error
    });
  }

  async return() {
    try {
      this.regService.setStep2Completed({});
      this.router.navigate(['/register/permissions']);
    } catch (error) {
      console.error('Error navigating to Step 3:', error);
    }
  }
}
