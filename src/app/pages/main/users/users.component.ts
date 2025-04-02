import { Component, OnDestroy, ViewChild } from '@angular/core';
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { TranslationService } from '../../../services/translate.service';
import { Subscription } from 'rxjs';
import { ListUsersComponent, User } from "../../../components/users/list-users/list-users.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SearchInputComponent, ListUsersComponent, CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnDestroy {
  @ViewChild(ListUsersComponent) listUsersComponent!: ListUsersComponent;

  title: string = '';
  subtitle: string = '';
  inputSearch: string = '';
  btnFilters: string = '';
  btnExport: string = '';

  currentSearchQuery: string = '';
  currentSelectedCount: number = 0;
  selectedUser: User | null = null;
  isDetailsOpen: boolean = false;

  private languageSubscription: Subscription;

  constructor(private translationService: TranslationService) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  ngOnInit() {
    this.loadTranslations();
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private loadTranslations(): void {
    const globalSection = 'Global_Components';
    const usersSection = 'Users_Page';

    this.inputSearch = this.translationService.getTranslation('inputSearch', globalSection);
    this.title = this.translationService.getTranslation('title', usersSection);
    this.subtitle = this.translationService.getTranslation('subtitle', usersSection);
    this.btnFilters = this.translationService.getTranslation('btnFilters', usersSection);
    this.btnExport = this.translationService.getTranslation('btnExport', usersSection);
  }

  handleSearchChange(query: string): void {
    this.currentSearchQuery = query;
  }

  handleSelectedCount(count: number): void {
    this.currentSelectedCount = count;
  }

  handleSelectedUsers(users: User[]): void {
    this.selectedUser = users.length === 1 ? users[0] : null;
    this.isDetailsOpen = !!this.selectedUser;
  }

  closeDetailsPanel(): void {
    this.isDetailsOpen = false;
    this.selectedUser = null;
    this.listUsersComponent?.resetSelections();
  }

  getSituationIcon(situation: string): string {
    const iconMap: Record<string, string> = {
      '1': 'situation-actived.svg',
      '-1': 'situation-disabled.svg',
      '0': 'situation-inactived.svg'
    };
    return `assets/svg/icon/users/${iconMap[situation] || 'situation-inactived.svg'}`;
  }

  translateSituation(situation: string): string {
    const situationMap: Record<string, string> = {
      '1': 'actived',
      '0': 'inactived',
      '-1': 'disabled'
    };
    return this.translationService.getTranslation(situationMap[situation], 'Users_Page');
  }
}
