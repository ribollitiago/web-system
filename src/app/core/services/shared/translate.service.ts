import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  // ------------------------------------------------------
  // START STATE
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
  // START CONSTRUCTOR
  // ------------------------------------------------------

  constructor() {

    const savedLanguage = localStorage.getItem('language');

    if (savedLanguage) {
      this.currentLanguage = savedLanguage;
    } else {
      const browserLanguage = navigator.language.split('-')[0];
      this.currentLanguage = browserLanguage === 'pt'
        ? 'pt_br'
        : 'en_us';
    }

    this.setLanguage(this.currentLanguage);
  }

  // ------------------------------------------------------
  // START PUBLIC API
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
  // START LANGUAGE LOADER
  // ------------------------------------------------------

  async setLanguage(language: string) {

    const lang = language || 'en_us';

    this.currentLanguage = lang;
    localStorage.setItem('language', lang);

    try {

      if (lang !== 'en_us') {
        const en_us = await import(`../../i18n/en_us.json`)
          .then(m => m.default || m);

        this.englishLanguage = en_us;
      }

      const response = await import(`../../i18n/${lang}.json`);
      this.translations = response.default || response;

      this.languageSubject.next(lang);
      this.languageLoadedSubject.next(true);

    } catch (error) {
      console.error(`Erro ao carregar tradução: ${lang}`, error);
    }
  }

  // ------------------------------------------------------
  // START TRANSLATIONS
  // ------------------------------------------------------

  getTranslation(path: string, section?: string): string {

    const finalPath = section
      ? `${section}.${path}`
      : path;

    const value =
      this.getValueFromPath(this.translations, finalPath) ??
      this.getValueFromPath(this.englishLanguage, finalPath);

    return value ?? finalPath;
  }

  // ------------------------------------------------------
  // START HELPERS
  // ------------------------------------------------------

  private getValueFromPath(obj: any, path: string): string | null {

    return path
      .split('.')
      .reduce((acc, part) => acc?.[part], obj) ?? null;
  }
}
