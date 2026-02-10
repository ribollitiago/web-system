import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/i18n/translate.service';
import { FirebaseService } from '../../../core/services/database/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SituationChipComponent } from '../../../shared/components/chip/situation-chip/situation-chip.component';
import { GroupChipComponent } from '../../../shared/components/chip/group-chip/group-chip.component';
import { DefaultListComponent, ColumnConfig } from '../../../shared/layout/default-list/default-list.component';

export interface User {
  id: number;
  name: string;
  email: string;
  date: string;
  phone: string;
  enrollment: string;
  description: string;
  permissions: [];
  groups: any[];
  situation: string;
}

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [CommonModule, FormsModule, SituationChipComponent, GroupChipComponent, DefaultListComponent],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.scss'
})
export class ListUsersComponent implements OnInit, OnDestroy {
  @ViewChild(DefaultListComponent) defaultList!: DefaultListComponent;

  @Input() searchQuery: string = '';
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 10;
  @Output() selectedCount = new EventEmitter<number>();
  @Output() selectedUsersEvent = new EventEmitter<User[]>();
  @Output() filteredUsersCount = new EventEmitter<number>();

  columns: ColumnConfig[] = [];
  users: User[] = [];
  groups: any[] = [];
  filteredUsers: User[] = [];
  private languageSubscription: Subscription;

  constructor(
    private translationService: TranslationService,
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();
      this.setupColumns();
    });
  }

  async ngOnInit() {
    this.loadTranslations();
    this.setupColumns();
    this.groups = await this.firebaseService.getList('groups');
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery']) {
      this.filterUsers();
    }
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
    this.firebaseService.unsubscribe('users')
  }

  private setupColumns(): void {
    this.columns = [
      { key: 'enrollment', label: 'Matrícula', flex: '0 0 80px' },
      { key: 'name', label: this.translationService.getTranslation('filterName', 'Users_Page'), flex: '3 1 13%' },
      { key: 'email', label: 'Email', flex: '3 1 18%' },
      { key: 'group', label: this.translationService.getTranslation('filterGroup', 'Users_Page'), flex: '1 1 17%' },
      { key: 'situation', label: this.translationService.getTranslation('filterSituation', 'Users_Page'), flex: '1 1 10%' },
      { key: 'more', label: this.translationService.getTranslation('filterMore', 'Users_Page'), flex: '0 0 30px', sortable: false }
    ];
  }

  private loadTranslations(): void {
    // Labels são carregadas no setupColumns via translationService
  }

  private loadUsers(): void {
    this.firebaseService.subscribe('users', (users: any[]) => {
      this.users = users || [];
      this.addGroupDetailsToUsers();
      this.sortUsersByEnrollment(); // Ordenação inicial por matrícula
      this.filterUsers();
    });
  }

  addGroupDetailsToUsers() {
    this.users = this.users.map(user => {
      const userWithGroupDetails = { ...user };
      if (Array.isArray(user.groups)) {
        userWithGroupDetails.groups = user.groups.map((groupUid: string) => {
          const group = this.groups.find(g => g.uid === groupUid);
          if (group) {
            const { users, ...groupWithoutUsers } = group;
            return groupWithoutUsers;
          }
          return null;
        }).filter(g => g !== null);
      } else {
        userWithGroupDetails.groups = [];
      }
      if (userWithGroupDetails.groups.length === 0) {
        userWithGroupDetails.groups = [{ title: 'Sem grupo atribuído' }];
      }
      return userWithGroupDetails;
    });
  }

  private sortUsersByEnrollment(): void {
    // Ordenação alfabética por matrícula
    this.users.sort((a, b) => {
      const enrollmentA = a.enrollment?.toString().toLowerCase() || '';
      const enrollmentB = b.enrollment?.toString().toLowerCase() || '';
      return enrollmentA.localeCompare(enrollmentB);
    });
  }

  private filterUsers(): void {
    const search = this.searchQuery?.toLowerCase().trim() || '';
    this.filteredUsers = search
      ? this.users.filter(user =>
        user.enrollment?.toString().includes(search) ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      )
      : [...this.users];

    this.filteredUsersCount.emit(this.filteredUsers.length);
    this.cdr.detectChanges();
  }

  onSelectionChange(selected: any[]): void {
    this.selectedUsersEvent.emit(selected);
    this.selectedCount.emit(selected.length);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onItemsPerPageChange(size: number): void {
    this.itemsPerPage = size;
  }

  onRowClick(user: User): void {
    // Seleciona o usuário individualmente para abrir os detalhes
    if (this.defaultList) {
      this.defaultList.clearSelection();
      // Simula o clique de seleção para o componente pai receber o evento
      this.onSelectionChange([user]);
      // E marca visualmente no componente de lista
      this.defaultList.selectedItems.add(user.enrollment);
    }
  }
}
