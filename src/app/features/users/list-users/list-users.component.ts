import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/i18n/translate.service';
import { FirebaseService } from '../../../core/services/database/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SituationChipComponent } from '../../../shared/components/chip/situation-chip/situation-chip.component';
import { GroupChipComponent } from '../../../shared/components/chip/group-chip/group-chip.component';

export interface User {
  id: number;
  name: string;
  email: string;
  date: string;
  phone: string;
  enrollment: string;
  permissions: [];
  group: any[];
  situation: string;
}

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [CommonModule, FormsModule, SituationChipComponent, GroupChipComponent],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.scss'
})
export class ListUsersComponent implements OnInit, OnDestroy {
  // ======================================================
  // INPUTS/OUTPUTS E PROPRIEDADES PÚBLICAS
  // ======================================================
  @Input() searchQuery: string = '';
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 10;
  @Output() selectedCount = new EventEmitter<number>();
  @Output() selectedUsersEvent = new EventEmitter<User[]>();
  @Output() filteredUsersCount = new EventEmitter<number>();

  // ======================================================
  // ESTADO DO COMPONENTE
  // ======================================================
  filterId: string = 'Id';
  filterName: string = '';
  filterEmail: string = 'Email';
  filterGroup: string = '';
  filterSituation: string = '';
  filterMore: string = '';

  totalPages: number = 1;
  allSelected: boolean = false;

  selectedUsers: Set<number> = new Set<number>();
  lastSingleSelected: number | null = null;

  users: User[] = [];
  groups: any[] = [];
  filteredUsers: User[] = [];
  private languageSubscription: Subscription;

  // ======================================================
  // CICLO DE VIDA DO COMPONENTE
  // ======================================================
  constructor(
    private translationService: TranslationService,
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  async ngOnInit() {
    this.loadTranslations();
    this.groups = await this.firebaseService.getAllEntity('groups');
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery'] || changes['itemsPerPage'] || changes['currentPage']) {
      this.filterUsers();
    }
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  // ======================================================
  // TRADUÇÕES E INTERNACIONALIZAÇÃO
  // ======================================================
  private loadTranslations(): void {
    const section = 'Users_Page';
    this.filterName = this.translationService.getTranslation('filterName', section);
    this.filterGroup = this.translationService.getTranslation('filterGroup', section);
    this.filterSituation = this.translationService.getTranslation('filterSituation', section);
    this.filterMore = this.translationService.getTranslation('filterMore', section);
  }

  // ======================================================
  // CARREGAMENTO DE DADOS DO FIREBASE
  // ======================================================
  private loadUsers(): void {
    this.firebaseService.subscribeToUsers((users: any[]) => {
      this.users = users;
      this.addGroupDetailsToUsers();
      this.sortUsersById();
      this.filterUsers();
    });
  }

  addGroupDetailsToUsers() {
    this.users = this.users.map(user => {
      const userWithGroupDetails = { ...user };

      if (Array.isArray(user.group)) {
        userWithGroupDetails.group = user.group.map((groupUid: string) => {
          const group = this.groups.find(g => g.uid === groupUid);
          if (group) {
            const { users, ...groupWithoutUsers } = group;
            return groupWithoutUsers;
          }
          return null;
        }).filter(group => group !== null);
      } else {
        userWithGroupDetails.group = [];
      }
      if (userWithGroupDetails.group.length === 0) {
        userWithGroupDetails.group = [{ title: 'Sem grupo atribuído' }];
      }

      return userWithGroupDetails;
    });

    console.log('Usuários com detalhes dos grupos:', this.users);
  }




  // ======================================================
  // FILTRAGEM E PAGINAÇÃO DE USUÁRIOS
  // ======================================================
  private sortUsersById(): void {
    this.users.sort((a, b) => b.id - a.id);
  }

  private filterUsers(): void {
    const search = this.searchQuery?.toLowerCase().trim() || '';

    const previousSelection = new Set(this.selectedUsers);

    this.filteredUsers = search
      ? this.users.filter(user =>
        user.id.toString().includes(search) ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      )
      : [...this.users];

    this.selectedUsers = new Set(
      Array.from(previousSelection).filter(id =>
        this.filteredUsers.some(user => user.id === id)
      )
    );

    this.updateTotalPages();
    this.filteredUsersCount.emit(this.filteredUsers.length);
    this.updateAllSelectedState();
    this.emitSelectedUsers();
  }

  get visibleUsers(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers.slice(start, end);
  }

  private updateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  // ======================================================
  // CONTROLES DE PAGINAÇÃO
  // ======================================================
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.resetSelections();
    this.filterUsers();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.refreshSelectionDisplay();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.refreshSelectionDisplay();
    }
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.refreshSelectionDisplay();
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

  // ======================================================
  // GERENCIAMENTO DE SELEÇÃO DE USUÁRIOS
  // ======================================================
  toggleUserSelection(userId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedUsers.has(userId)
      ? this.selectedUsers.delete(userId)
      : this.selectedUsers.add(userId);
    this.updateSelections();
  }

  selectSingleUser(userId: number): void {
    if (this.lastSingleSelected === userId) {
      this.selectedUsers.clear();
      this.lastSingleSelected = null;
    } else {
      this.selectedUsers.clear();
      this.selectedUsers.add(userId);
      this.lastSingleSelected = userId;
    }
    this.updateSelections();
  }

  toggleSelectAll(event: MouseEvent): void {
    event.stopPropagation();
    const visibleIds = this.visibleUsers.map(user => user.id);
    const allSelected = visibleIds.every(id => this.selectedUsers.has(id));

    allSelected
      ? visibleIds.forEach(id => this.selectedUsers.delete(id))
      : visibleIds.forEach(id => this.selectedUsers.add(id));

    this.updateSelections();
  }

  private updateSelections(): void {
    this.lastSingleSelected = null;
    this.updateAllSelectedState();
    this.emitSelectedUsers();
    this.selectedCount.emit(this.selectedUsers.size);
    this.cdr.detectChanges();
  }

  private updateAllSelectedState(): void {
    const visible = this.visibleUsers;
    this.allSelected = visible.length > 0 && visible.every(user => this.selectedUsers.has(user.id));
  }

  public resetSelections(): void {
    this.selectedUsers.clear();
    this.lastSingleSelected = null;
    this.allSelected = false;
    this.emitSelectedUsers();
    this.updateSelections();
  }

  // ======================================================
  // UTILITÁRIOS E MÉTODOS AUXILIARES
  // ======================================================
  isSelected(userId: number): boolean {
    return this.selectedUsers.has(userId);
  }

  trackByUserId(user: User): number {
    return user.id;
  }

  // ======================================================
  // COMUNICAÇÃO COM COMPONENTES PAI
  // ======================================================
  private emitSelectedUsers(): void {
    const selected = Array.from(this.selectedUsers)
      .map(id => this.filteredUsers.find(u => u.id === id))
      .filter((user): user is User => !!user);
    this.selectedUsersEvent.emit(selected);
  }

  // ======================================================
  // ATUALIZAÇÃO DE INTERFACE
  // ======================================================
  public refreshSelectionDisplay(): void {
    this.cdr.detectChanges();
  }
}
