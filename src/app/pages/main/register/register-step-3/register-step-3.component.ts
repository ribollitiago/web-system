import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../../../services/translate.service';
import { RegisterService } from '../../../../services/register.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DefaultStepComponent } from "../../../../layout/default-step/default-step.component";

@Component({
  selector: 'app-register-step-3',
  imports: [
    CommonModule,
    FormsModule,
    DefaultStepComponent
],
  templateUrl: './register-step-3.component.html',
  styleUrl: './register-step-3.component.scss'
})
export class RegisterStep3Component implements OnInit{
  isLoading = false;
  registrationData: any = {};

  title: string = '';
  subtitle: string = '';
  textExplanation: string = '';
  placeholderTextArea: string = '';
  btnLast: string = '';

  textTyped: string = '';
  textSave: string = '';

  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
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
    this.btnLast = this.translationService.getTranslation('btnRegister', section);
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
