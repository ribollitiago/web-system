import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../services/translate.service';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../services/firebase.service';
import { FormsModule } from '@angular/forms';

export interface User {
  id: number;
  name: string;
  email: string;
  date: string;
  situation: string;
}

@Component({
  selector: 'app-list-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.scss'
})
export class ListUsersComponent {
  filterId: string = 'Id';
  filterName: string = '';
  filterEmail: string = 'Email';
  filterDate: string = '';
  filterSituation: string = '';
  filterMore: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  users: User[] = [];

  private languageSubscription: Subscription;

  constructor(
    private translationService: TranslationService,
    private firebaseService: FirebaseService
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();

    });

  }

  ngOnInit() {
    this.loadTranslations();
    this.loadUsers();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private loadTranslations(): void {
    const section2 = 'Users_Page'
    this.filterName = this.translationService.getTranslation('filterName', section2);
    this.filterDate = this.translationService.getTranslation('filterDate', section2);
    this.filterSituation = this.translationService.getTranslation('filterSituation', section2);
    this.filterMore = this.translationService.getTranslation('filterMore', section2);
  }

  // private loadUsers(): void {
  //   this.firebaseService.subscribeToUsers((users: any[]) => {
  //     this.users = users;
  //     this.sortUsersById();
  //     this.updateTotalPages();
  //   });
  // }

  //*****************************************************************************************************************
  //*********************AO USAR PARA TESTAR JUNTO COM AS ULTIMAS FUNÇÕES, DESATIVAR O OUTRO LOAD USERS**************
  private loadUsers(): void {
    this.users = this.generateMockUsers();
    this.sortUsersById();
    this.updateTotalPages();
  }
  //*****************************************************************************************************************

  private sortUsersById(): void {
    this.users = this.users.sort((a, b) => a.id - b.id);
  }

  getSituationIcon(situation: string): string {
    const iconMap: { [key: string]: string } = {
      'actived': 'situation-actived.svg',
      'disabled': 'situation-disabled.svg',
      'inactived': 'situation-inactived.svg'
    };
    return `assets/svg/icon/users/${iconMap[situation.toLowerCase()] || 'situation-inactived.svg'}`;
  }

  get visibleUsers(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.users.slice(start, end);
  }

  private updateTotalPages(): void {
    this.totalPages = Math.ceil(this.users.length / this.itemsPerPage) || 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updateTotalPages();
  }

  get maxListHeight(): string {
    const baseHeight = 45;
    const maxVisibleRows = 10;
    return `calc(${maxVisibleRows * baseHeight}px + 20px)`;
  }

  get displayedPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 5) {
      return Array.from({length: total}, (_, i) => i + 1);
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

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  //*****************************************************************************************************************
  //******************************************* APENAS PARA TESTE ***************************************************
  private generateMockUsers(): User[] {
    const mockUsers: User[] = [];
    const situations = ['actived', 'disabled', 'inactived'];

    for (let i = 1; i <= 100; i++) {
      mockUsers.push({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        date: this.generateRandomDate(),
        situation: situations[Math.floor(Math.random() * situations.length)]
      });
    }
    return mockUsers;
  }

  private generateRandomDate(): string {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }
  //*****************************************************************************************************************
}
