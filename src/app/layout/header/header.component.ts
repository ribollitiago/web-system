import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translate.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  constructor(private loginService: LoginService,
    private router: Router,
    private translationService: TranslationService) { }

  account: string = '';
  signout: string = '';
  language: string = '';
  apparence: string = '';
  settings: string = '';
  help: string = '';
  feedback: string = '';
  titleLanguage: string = '';

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('userToggler') userTogglerElement!: ElementRef;
  @ViewChild('menuLanguage') menuLanguageElement!: ElementRef;
  @ViewChild('languageToggler') languageTogglerElement!: ElementRef;

  selectedLanguage!: string;
  isMenuOpened: boolean = false;
  isMenuOpenedLanguage: boolean = false;

  private mainMenuClickListener?: (event: MouseEvent) => void;
  private languageMenuClickListener?: (event: MouseEvent) => void;

  ngOnInit(): void {
    this.selectedLanguage = this.translationService.getCurrentLanguage();
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
  }

  ngOnDestroy(): void {
    this.removeMainMenuClickListener();
    this.removeLanguageMenuClickListener();
  }

  loadTranslations() {
    const section = "Header_user";
    try {
      this.account = this.translationService.getTranslation('account', section);
      this.signout = this.translationService.getTranslation('signout', section);
      this.language = this.translationService.getTranslation('language', section);
      this.apparence = this.translationService.getTranslation('apparence', section);
      this.settings = this.translationService.getTranslation('settings', section);
      this.help = this.translationService.getTranslation('help', section);
      this.feedback = this.translationService.getTranslation('feedback', section);
      this.titleLanguage = this.translationService.getTranslation('titleLanguage', section);

    } catch (error) {
      console.error('Error loading sidebar translations:', error);
    }
  }

  toggleMenu(): void {
    this.isMenuOpened = !this.isMenuOpened;
    this.isMenuOpenedLanguage = false; // Fecha o menu de linguagem ao abrir o principal
    if (this.isMenuOpened) {
      this.addMainMenuClickListener();
    } else {
      this.removeMainMenuClickListener();
    }
  }

  toggleMenuLanguage(): void {
    this.isMenuOpenedLanguage = !this.isMenuOpenedLanguage;
    this.isMenuOpened = false; // Fecha o menu principal ao abrir o de linguagem
    if (this.isMenuOpenedLanguage) {
      this.addLanguageMenuClickListener();
    } else {
      this.removeLanguageMenuClickListener();
    }
  }

  private addMainMenuClickListener(): void {
    this.mainMenuClickListener = (event: MouseEvent) => {
      const clickedInside = this.menuElement?.nativeElement.contains(event.target);
      const clickedOnToggler = this.userTogglerElement?.nativeElement.contains(event.target);

      if (!clickedInside && !clickedOnToggler) {
        this.isMenuOpened = false;
        this.removeMainMenuClickListener();
      }
    };

    setTimeout(() => document.addEventListener('click', this.mainMenuClickListener!), 0);
  }

  private addLanguageMenuClickListener(): void {
    this.languageMenuClickListener = (event: MouseEvent) => {
      const clickedInside = this.menuLanguageElement?.nativeElement.contains(event.target);
      const clickedOnToggler = this.languageTogglerElement?.nativeElement.contains(event.target);

      if (!clickedInside && !clickedOnToggler) {
        this.isMenuOpenedLanguage = false;
        this.removeLanguageMenuClickListener();
      }
    };

    setTimeout(() => document.addEventListener('click', this.languageMenuClickListener!), 0);
  }

  private removeMainMenuClickListener(): void {
    if (this.mainMenuClickListener) {
      document.removeEventListener('click', this.mainMenuClickListener);
      this.mainMenuClickListener = undefined;
    }
  }

  private removeLanguageMenuClickListener(): void {
    if (this.languageMenuClickListener) {
      document.removeEventListener('click', this.languageMenuClickListener);
      this.languageMenuClickListener = undefined;
    }
  }

  onLanguageChange(event: any): void {
    const target = event.target.closest('.menu-item-language');
    if (target) {
      const selectedLanguage = target.dataset.value;
      this.translationService.setLanguage(selectedLanguage);
      this.isMenuOpenedLanguage = false;
      window.location.reload();
    }
  }

  logout() {
    this.loginService.logout().then(() => {
      console.log('Logout realizado com sucesso!');
      this.router.navigate(['/login']);
    }).catch((err) => {
      console.error('Erro ao fazer logout:', err);
    });
  }
}
