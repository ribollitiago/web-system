import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../services/translate.service';
import { CommonModule } from '@angular/common';

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

  usersMap = new Map<number, User>([
    [1, { id: 1, name: 'Tiago Ribolli', email: 'ribollitiago@gmail.com', date: '01/01/2025', situation: 'Active' }],
    [2, { id: 2, name: 'João Silva', email: 'joao.silva@example.com', date: '02/02/2024', situation: 'Inactive' }],
    [3, { id: 3, name: 'Maria Oliveira', email: 'maria.oliveira@example.com', date: '15/03/2024', situation: 'Active' }],
    [4, { id: 4, name: 'Carlos Souza', email: 'carlos.souza@example.com', date: '22/04/2023', situation: 'Pending' }],
    [5, { id: 5, name: 'Ana Costa', email: 'ana.costa@example.com', date: '10/05/2024', situation: 'Active' }],
    [6, { id: 6, name: 'Pedro Santos', email: 'pedro.santos@example.com', date: '05/06/2023', situation: 'Inactive' }],
    [7, { id: 7, name: 'Juliana Lima', email: 'juliana.lima@example.com', date: '18/07/2024', situation: 'Active' }],
    [8, { id: 8, name: 'Fernando Rocha', email: 'fernando.rocha@example.com', date: '30/08/2023', situation: 'Pending' }],
    [9, { id: 9, name: 'Patrícia Alves', email: 'patricia.alves@example.com', date: '12/09/2024', situation: 'Active' }],
    [10, { id: 10, name: 'Ricardo Nunes', email: 'ricardo.nunes@example.com', date: '25/10/2023', situation: 'Inactive' }]
  ]);

  users: User[] = [];


  private languageSubscription: Subscription;

  constructor(private translationService: TranslationService) {
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
    // Converte o Map para array para usar no ngFor
    this.users = Array.from(this.usersMap.values());
  }
}
