import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../core/services/shared/translate.service';
import { SessionService } from '../../core/services/session/session.service';
import { LoginService } from '../../core/services/auth/login.service';
import { DefaultPopupComponent } from "../../shared/components/popup/default-popup/default-popup.component";

@Component({
  selector: 'app-header',
  imports: [CommonModule, DefaultPopupComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  constructor(
    private sessionService: SessionService,
    private loginService: LoginService,
    private router: Router,
    private translationService: TranslationService) { }

  account: string = '';
  tooltipNotifications: string = '';
  signout: string = '';
  language: string = '';
  apparence: string = '';
  settings: string = '';
  help: string = '';
  feedback: string = '';
  titleLanguage: string = '';
  userName: string = '';
  userEmail: string = '';

  //DialogBox
  dialogTitle = '';
  dialogDescription = '';
  dialogBtnLeft = '';
  dialogBtnRight = '';

  popupBtnLeftColor = 'var(--dialog-btn-left)';
  popupBtnRightColor = 'var(--dialog-btn-right)';

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('userToggler') userTogglerElement!: ElementRef;
  @ViewChild('menuLanguage') menuLanguageElement!: ElementRef;
  @ViewChild('languageToggler') languageTogglerElement!: ElementRef;

  @ViewChild(DefaultPopupComponent) popup!: DefaultPopupComponent;

  selectedLanguage!: string;
  supportedLanguages: any[] = [];
  isMenuOpened: boolean = false;
  isMenuOpenedLanguage: boolean = false;

  private mainMenuClickListener?: (event: MouseEvent) => void;
  private languageMenuClickListener?: (event: MouseEvent) => void;

  ngOnInit(): void {

    this.sessionService.user$.subscribe(user => {
      if (user) {
        this.userName = user.name;
        this.userEmail = user.email;
      }
    });

    this.supportedLanguages = this.translationService.getSupportedLanguages();
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
    const section = "header_user";
    const dialog = "dialog_logout."

    try {
      this.tooltipNotifications = this.translationService.getTranslation('tooltipNotifications', section);
      this.account = this.translationService.getTranslation('account', section);
      this.signout = this.translationService.getTranslation('signout', section);
      this.language = this.translationService.getTranslation('language', section);
      this.apparence = this.translationService.getTranslation('apparence', section);
      this.settings = this.translationService.getTranslation('settings', section);
      this.help = this.translationService.getTranslation('help', section);
      this.feedback = this.translationService.getTranslation('feedback', section);
      this.titleLanguage = this.translationService.getTranslation('titleLanguage', section);

      this.dialogTitle = this.translationService.getTranslation(dialog + 'title', section);
      this.dialogDescription = this.translationService.getTranslation(dialog + 'description', section);
      this.dialogBtnLeft = this.translationService.getTranslation(dialog + 'buttonLeftTitle', section);
      this.dialogBtnRight = this.translationService.getTranslation(dialog + 'buttonRightTitle', section);
    } catch (error) {
      console.error('Error loading sidebar translations:', error);
    }
  }

  toggleMenu(): void {
    this.isMenuOpened = !this.isMenuOpened;
    this.isMenuOpenedLanguage = false;
    if (this.isMenuOpened) {
      this.addMainMenuClickListener();
    } else {
      this.removeMainMenuClickListener();
    }
  }

  toggleMenuLanguage(): void {
    this.isMenuOpenedLanguage = !this.isMenuOpenedLanguage;
    this.isMenuOpened = false;
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

  truncateText(text: string, maxLength: number = 30): string {
    if (!text) return '';

    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + '...';
    }
    return text;
  }

  onLanguageChange(languageCode: string): void {
    this.translationService.setLanguage(languageCode);
    this.isMenuOpenedLanguage = false;
    window.location.reload();
  }

  logout() {
    this.loginService.logout().then(() => {
      console.log('Logout realizado com sucesso!');
      this.router.navigate(['/login']);
    }).catch((err) => {
      console.error('Erro ao fazer logout:', err);
    });
  }

  handleOpenDialog() {
    this.popup.open();
  }
}
