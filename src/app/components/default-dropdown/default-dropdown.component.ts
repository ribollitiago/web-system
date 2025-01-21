import { Component, NgModule, OnInit } from '@angular/core';
import { TranslationService } from '../../services/translate.service'; // Ajuste conforme necessário
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-default-dropdown',
  templateUrl: './default-dropdown.component.html',
  styleUrl: './default-dropdown.component.scss',
  imports: [ FormsModule]
})
export class DefaultDropdownComponent implements OnInit {

  selectedLanguage!: string;

  constructor(private translationService: TranslationService) { }

  ngOnInit(): void {
    // Inicializa a linguagem com o valor do serviço de tradução
    this.selectedLanguage = this.translationService.getCurrentLanguage();
  }

  onLanguageChange(event: any): void {
    const selectedLanguage = event.target.value;

    // Altera o idioma conforme a seleção
    this.translationService.setLanguage(selectedLanguage);
  }
}
