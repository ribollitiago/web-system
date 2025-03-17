import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../../../services/translate.service';
import { RegisterService } from '../../../../services/register.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-step-3',
  imports: [
    CommonModule,
    FormsModule
  ],
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
  textExplanation: string = '';
  placeholderTextArea: string = '';
  btnRegister: string = '';

  textTyped: string = '';
  textSave: string = '';

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
    const section = 'Extra_info_page';
    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);
    this.textExplanation = this.translationService.getTranslation('textExplanation', section);
    this.placeholderTextArea = this.translationService.getTranslation('placeholderTextArea', section);
    this.btnRegister = this.translationService.getTranslation('btnRegister', section);

    const section2 = 'Register_Page';
    this.stepOne = this.translationService.getTranslation('stepOne', section2);
    this.stepTwo = this.translationService.getTranslation('stepTwo', section2);
    this.stepThree = this.translationService.getTranslation('stepThree', section2);
  }

  saveText() {
    this.textSave = this.textTyped; // Salva o texto na variável
  }

  async submit() {
    this.registerService.setCurrentStep(4);
  }

  async return() {
    this.registerService.setCurrentStep(2);
  }
}
