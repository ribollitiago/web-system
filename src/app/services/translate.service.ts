import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: any = {};
  private currentLanguage = 'en_us';
  private languageSubject = new BehaviorSubject<string>(this.currentLanguage);
  private languageLoadedSubject = new BehaviorSubject<boolean>(false);

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
    this.currentLanguage = language;
    localStorage.setItem('language', language);

    try {
      const response = await import(`../../../public/assets/i18n/${language}.json`);
      this.translations = response;

      this.languageSubject.next(language);
      this.languageLoadedSubject.next(true);
    } catch (error) {
      console.error(`Erro ao carregar o arquivo de tradução para o idioma: ${language}`, error);
    }
  }

  getTranslation(key: string, section: string): string {
    return this.translations[section]?.[key] || key;
  }
}
