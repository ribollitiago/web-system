import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../services/translate.service';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
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
export class ListUsersComponent implements OnDestroy {
  // ======================================================
  // INPUTS/OUTPUTS E PROPRIEDADES PÚBLICAS
  // ======================================================
  @Input() searchQuery: string = '';
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 10;
  @Output() filteredUsersCount = new EventEmitter<number>();
  @Output() selectedCount = new EventEmitter<number>();
  @Output() selectedUsersEvent = new EventEmitter<User[]>();

  // ======================================================
  // ESTADO DO COMPONENTE
  // ======================================================
  filterId: string = 'Id';
  filterName: string = '';
  filterEmail: string = 'Email';
  filterDate: string = '';
  filterSituation: string = '';
  filterMore: string = '';

  selectedUsers: Set<number> = new Set<number>();
  lastSingleSelected: number | null = null;
  allSelected: boolean = false;

  users: User[] = [];
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

  ngOnInit() {
    this.loadTranslations();
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery'] || changes['itemsPerPage']) {
      this.filterUsers();
    }
    else if (changes['currentPage']) {
      this.updateAllSelectedState();
      this.cdr.detectChanges();
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
    this.filterDate = this.translationService.getTranslation('filterDate', section);
    this.filterSituation = this.translationService.getTranslation('filterSituation', section);
    this.filterMore = this.translationService.getTranslation('filterMore', section);
  }

  translateField(fieldName: string, fieldValue: string): string {
    const fieldMap: { [key: string]: { [key: string]: string } } = {
      situation: {
        '1': 'actived',
        '0': 'inactived',
        '-1': 'disabled'
      },
      status: {
        '1': 'enabled',
        '0': 'disabled'
      },
    };
    return this.translationService.getTranslation(fieldMap[fieldName][fieldValue], 'Users_Page');
  }

  // ======================================================
  // CARREGAMENTO DE DADOS DO FIREBASE
  // ======================================================

  private loadUsers(): void {
    this.firebaseService.subscribeToUsers((users: any[]) => {
      this.users = users;
      console.log('Filtered Users:', this.users);
      this.sortUsersById();
      this.filterUsers();
      this.filteredUsersCount.emit(this.filteredUsers.length);

    });
  }

  // ======================================================
  // FILTRAGEM E PAGINAÇÃO DE USUÁRIOS
  // ======================================================

  private sortUsersById(): void {
    this.users.sort((a, b) => b.id - a.id);
  }

  private filterUsers(): void {
    const search = this.searchQuery.toLowerCase();

    const previousSelection = new Set(this.selectedUsers);

    this.filteredUsers = this.searchQuery
      ? this.users.filter(user =>
        user.id.toString().includes(search) ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      )
      : [...this.users];

    // Restaura apenas as seleções que existem na nova lista filtrada
    this.selectedUsers = new Set(
      Array.from(previousSelection).filter(id =>
        this.filteredUsers.some(user => user.id === id)
      ));

    this.filteredUsersCount.emit(this.filteredUsers.length);
    this.updateAllSelectedState();
    this.emitSelectedUsers();
  }

  get visibleUsers(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers.slice(start, end);
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

  getSituationIcon(situation: string | null | undefined): string {
    const situationValue = situation?.toString() || '0';
    const iconMap: { [key: string]: string } = {
      '1': 'situation-actived.svg',
      '-1': 'situation-disabled.svg',
      '0': 'situation-inactived.svg'
    };
    return `assets/svg/icon/users/${iconMap[situationValue] || 'situation-inactived.svg'}`;
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
