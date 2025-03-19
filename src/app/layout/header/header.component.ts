import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  constructor(private loginService: LoginService,
      private router: Router){}

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('userToggler') userTogglerElement!: ElementRef;
  isMenuOpened: boolean = false;

  private clickListener?: (event: MouseEvent) => void;

  toggleMenu(): void {
    this.isMenuOpened = !this.isMenuOpened;
    if (this.isMenuOpened) {
      this.addDocumentClickListener();
    } else {
      this.removeDocumentClickListener();
    }
  }

  private addDocumentClickListener(): void {
    this.clickListener = (event: MouseEvent) => {
      const clickedInsideMenu = this.menuElement?.nativeElement.contains(event.target);
      const clickedOnToggler = this.userTogglerElement?.nativeElement.contains(event.target);

      if (!clickedInsideMenu && !clickedOnToggler) {
        this.isMenuOpened = false;
        this.removeDocumentClickListener();
      }
    };

    // Adiciona pequeno delay para evitar fechar imediatamente
    setTimeout(() => {
      document.addEventListener('click', this.clickListener!);
    }, 0);
  }

  private removeDocumentClickListener(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = undefined;
    }
  }

  ngOnDestroy(): void {
    this.removeDocumentClickListener();
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
