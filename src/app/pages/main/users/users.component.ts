import { Component, OnDestroy } from '@angular/core';
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { TranslationService } from '../../../services/translate.service';
import { Subscription } from 'rxjs';
import { ListUsersComponent } from "../../../components/users/list-users/list-users.component";

@Component({
  selector: 'app-users',
  imports: [SearchInputComponent, ListUsersComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnDestroy{
  currentSearchQuery: string = '';

  title: string = '';
  subtitle: string = '';
  inputSearch: string = '';
  btnFilters: string = '';
  btnExport: string = '';

  private languageSubscription: Subscription;

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
}
