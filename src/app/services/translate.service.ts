import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: any = {};
  private currentLanguage = 'en_us';
  constructor() {}

  async setLanguage(language: string) {
    this.currentLanguage = language;
    try {
      const response = await import(`../../../public/assets/i18n/${language}.json`)
      this.translations = response;
    } catch (error) {
      console.error(`Erro ao carregar o arquivo de tradução para o idioma: ${language}`, error);
    }
  }

  // Método para obter a tradução de uma chave
  getTranslation(key: string, section: string): string {
    return this.translations[section]?.[key] || key;
  }
}
