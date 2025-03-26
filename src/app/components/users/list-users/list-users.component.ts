import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../services/translate.service';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../services/firebase.service';

export interface User {
  id: number;
  name: string;
  email: string;
  date: string;
  situation: string;
}

@Component({
  selector: 'app-list-users',
  imports: [CommonModule],
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

  private loadUsers(): void {
    this.firebaseService.subscribeToUsers((users: any[]) => {
      this.users = users;
    });
  }
}
