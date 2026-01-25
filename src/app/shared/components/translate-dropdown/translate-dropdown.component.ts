import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../../core/services/i18n/translate.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-translate-dropdown',
  templateUrl: './translate-dropdown.component.html',
  styleUrl: './translate-dropdown.component.scss',
  imports: [FormsModule, CommonModule]
})
export class TranslateDropdownComponent implements OnInit {
  selectedLanguage!: string;
  supportedLanguages: { code: string, name: string }[] = [];

  constructor(private translationService: TranslationService) { }

  ngOnInit(): void {
    this.supportedLanguages = this.translationService.getSupportedLanguages();
    this.selectedLanguage = this.translationService.getCurrentLanguage();
  }

  onLanguageChange(langCode: string): void {
    this.translationService.setLanguage(langCode);
  }
}
