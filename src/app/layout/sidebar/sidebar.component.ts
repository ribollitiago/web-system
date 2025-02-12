import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SearchInputComponent } from "../../components/search-input/search-input.component";
import { TranslationService } from '../../services/translate.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, SearchInputComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [TranslationService]
})
export class SidebarComponent {
  @Input() isLeftSidebarCollapsed: boolean = false;
  @Output() changeIsLeftSidebarCollapsed = new EventEmitter<boolean>();
  @ViewChild(SearchInputComponent) searchInputComponent!: SearchInputComponent;

  inputSearch: string = '';
  linkHome: string = '';
  linkRegister: string = '';
  linkUsers: string = '';

  items: { routeLink: string, icon: string, label: string }[] = [];

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
  }

  loadTranslations() {
    const section = "Sidebar";
    try {
      this.inputSearch = this.translationService.getTranslation('inputSearch', section);
      this.linkHome = this.translationService.getTranslation('linkHome', section);
      this.linkRegister = this.translationService.getTranslation('linkRegister', section);
      this.linkUsers = this.translationService.getTranslation('linkUsers', section);

      this.items = [
        { routeLink: '/home', icon: 'assets/svg/icon/home.svg', label: this.linkHome },
        { routeLink: '/register', icon: 'assets/svg/icon/register.svg', label: this.linkRegister },
        { routeLink: '/users', icon: 'assets/svg/icon/users.svg', label: this.linkUsers }
      ];
    } catch (error) {
      console.error('Error loading sidebar translations:', error);
    }
  }

  handleSearchIconClick() {
    if (this.isLeftSidebarCollapsed) {
      this.toggleSidebar();
      setTimeout(() => this.searchInputComponent.focusInput(), 200);
    }
  }

  toggleSidebar() {
    this.isLeftSidebarCollapsed = !this.isLeftSidebarCollapsed;
    this.changeIsLeftSidebarCollapsed.emit(this.isLeftSidebarCollapsed);
  }
}
