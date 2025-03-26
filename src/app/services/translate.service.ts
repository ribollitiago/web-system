import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: any = {};
  private englishLanguage: any = {};
  private currentLanguage = 'en_us';
  private languageSubject = new BehaviorSubject<string>(this.currentLanguage);
  private languageLoadedSubject = new BehaviorSubject<boolean>(false);

  private supportedLanguages = [
    { code: 'pt_pt', name: 'Português (PT)' },
    { code: 'pt_br', name: 'Português (Brasil)' },
    { code: 'en_us', name: 'English (US)' },
    { code: 'en_uk', name: 'English (UK)' }
  ];

  constructor() {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      this.currentLanguage = savedLanguage;
    } else {
      const browserLanguage = navigator.language.split('-')[0];
      this.currentLanguage = browserLanguage === 'pt' ? 'pt_br' : 'en_us';
    }

    this.setLanguage(this.currentLanguage);
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  get language$() {
    return this.languageSubject.asObservable();
  }

  get languageLoaded$() {
    return this.languageLoadedSubject.asObservable();
  }

  async setLanguage(language: string) {
    const lang = 'en_us';
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);

    try {
      if (lang != 'en_us') {
        const en_us = await import(`../../../public/assets/i18n/en_us.json`);
        this.englishLanguage = en_us;
      }
      const response = await import(`../../../public/assets/i18n/${lang}.json`);
      this.translations = response;

      this.languageSubject.next(lang);
      this.languageLoadedSubject.next(true);
    } catch (error) {
      console.error(`Erro ao carregar o arquivo de tradução para o idioma: ${lang}`, error);
    }
  }

  getTranslation(key: string, section: string): string {
    return this.translations[section]?.[key] || this.englishLanguage[section]?.[key];
  }
}
