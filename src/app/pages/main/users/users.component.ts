import { Component, OnDestroy, ViewChild } from '@angular/core';
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { TranslationService } from '../../../services/translate.service';
import { Subscription } from 'rxjs';
import { ListUsersComponent, User } from "../../../components/users/list-users/list-users.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  imports: [SearchInputComponent, ListUsersComponent, CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnDestroy{
  @ViewChild(ListUsersComponent) listUsersComponent!: ListUsersComponent;

  currentSearchQuery: string = '';

  title: string = '';
  subtitle: string = '';
  inputSearch: string = '';
  btnFilters: string = '';
  btnExport: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  filteredUsersCount: number = 0;
  currentSelectedCount: number = 0;

  selectedUser: User | null = null;

  private languageSubscription: Subscription;
  cdr: any;

  constructor (private translationService: TranslationService){this.languageSubscription = this.translationService.language$.subscribe(() => {
    this.loadTranslations();
  });}

  ngOnInit() {
    this.loadTranslations();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private loadTranslations(): void {
    const section = 'Global_Components';
    this.inputSearch = this.translationService.getTranslation('inputSearch', section);

    const section2 = 'Users_Page'
    this.title = this.translationService.getTranslation('title', section2);
    this.subtitle = this.translationService.getTranslation('subtitle', section2);
    this.btnFilters = this.translationService.getTranslation('btnFilters', section2);
    this.btnExport = this.translationService.getTranslation('btnExport', section2);

  }

  handleSearchChange(query: string): void {
    this.currentSearchQuery = query;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.listUsersComponent.refreshSelectionDisplay(); // Adicione esta linha
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.listUsersComponent.refreshSelectionDisplay(); // Adicione esta linha
    }
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.listUsersComponent.refreshSelectionDisplay(); // Adicione esta linha
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.listUsersComponent.resetSelections(); // Reset explícito apenas quando muda itemsPerPage
    this.updateTotalPages();
  }

  private updateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredUsersCount / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  get displayedPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    pages.push(1);

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 3) {
      end = 4;
    } else if (current >= total - 2) {
      start = total - 3;
    }

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < total) {
        pages.push(i);
      }
    }

    if (end < total - 1) {
      pages.push('...');
    }

    if (total > 1) {
      pages.push(total);
    }

    return pages;
  }

  handleFilteredUsersCount(count: number): void {
    this.filteredUsersCount = count;
    this.updateTotalPages();
  }

  handleSelectedCount(count: number) {
    this.currentSelectedCount = count;
  }

  handleSelectedUsers(users: User[]): void {
    this.selectedUser = users.length === 1 ? users[0] : null;
  }

  getSituationIcon(situation: string): string {
    const iconMap: { [key: string]: string } = {
      '1': 'situation-actived.svg',
      '-1': 'situation-disabled.svg',
      '0': 'situation-inactived.svg'
    };
    return `assets/svg/icon/users/${iconMap[situation] || 'situation-inactived.svg'}`;
  }

  translateSituation(situation: string): string {
    const situationMap: { [key: string]: string } = {
      '1': 'actived',
      '0': 'inactived',
      '-1': 'disabled'
    };
    return this.translationService.getTranslation(situationMap[situation], 'Users_Page');
  }
}
