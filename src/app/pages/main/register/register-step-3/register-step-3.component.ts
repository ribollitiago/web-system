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
    private registerService: RegisterService,
    private router: Router
  ) { }

  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
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
    this.registerService.registerUser().then(() => {
      this.router.navigate(['/home']);
    }).catch(error => {
      // Handle error
    });
  }

  async return() {
    this.registerService.setCurrentStep(2);
  }
}
