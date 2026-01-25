import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  // ------------------------------------------------------
  // SEÇÃO: CONFIGURAÇÕES
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // SEÇÃO: CONSTRUTOR
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // SEÇÃO: API PÚBLICA
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // SEÇÃO: CARREGAMENTO DE IDIOMA
  // ------------------------------------------------------

  async setLanguage(language: string) {
    const lang = language || 'en_us';
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);

    try {
      if (lang !== 'en_us') {
        const en_us = await import(`../../../../../public/assets/i18n/en_us.json`).then(m => m.default || m);
        this.englishLanguage = en_us;
      }

      const response = await import(`../../../../../public/assets/i18n/${lang}.json`);
      this.translations = response;

      this.languageSubject.next(lang);
      this.languageLoadedSubject.next(true);
    } catch (error) {
      console.error(`Erro ao carregar tradução: ${lang}`, error);
    }
  }

  // ------------------------------------------------------
  // SEÇÃO: TRADUÇÕES
  // ------------------------------------------------------

  getTranslation(key: string, section: string): string {
    return (
      this.translations[section]?.[key] ||
      this.englishLanguage[section]?.[key]
    );
  }
}