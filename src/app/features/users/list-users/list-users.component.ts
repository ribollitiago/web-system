import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/shared/translate.service';
import { FirebaseService } from '../../../core/services/database/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SituationChipComponent } from '../../../shared/components/chip/situation-chip/situation-chip.component';
import { GroupChipComponent } from '../../../shared/components/chip/group-chip/group-chip.component';
import { DefaultListComponent, ColumnConfig } from '../../../shared/layout/default-list/default-list.component';
import { StatusChipComponent } from "../../../shared/components/chip/status-chip/status-chip.component";

export interface Session {
  isOnline?: boolean;
  blocked?: boolean;
  [key: string]: any;
}

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
  session?: Session;
}

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [CommonModule, FormsModule, SituationChipComponent, GroupChipComponent, DefaultListComponent, StatusChipComponent],
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
      {
        key: 'enrollment',
        label: 'Matrícula',
        flex: '0 0 80px',
        sortFn: this.sortEnrollment.bind(this) // Alfabeto primeiro, depois numérico
      },
      {
        key: 'name',
        label: this.translationService.getTranslation('filterName', 'users_page'),
        flex: '3 1 13%',
        sortFn: this.sortAlphabetically.bind(this) // Ordenação alfabética
      },
      {
        key: 'email',
        label: 'Email',
        flex: '3 1 18%',
        sortFn: this.sortAlphabetically.bind(this) // Ordenação alfabética
      },
      {
        key: 'groups',
        label: this.translationService.getTranslation('filterGroup', 'users_page'),
        flex: '1 1 17%',
        sortFn: this.sortByGroupCount.bind(this)
      },
      {
        key: 'status',
        label: this.translationService.getTranslation('filterStatus', 'users_page'),
        flex: '1 1 10%',
        sortable: true,
        sortFn: this.sortByOnlineStatus.bind(this)
      },
      {
        key: 'situation',
        label: this.translationService.getTranslation('filterSituation', 'users_page'),
        flex: '1 1 4%',
        sortable: true,
        sortFn: this.sortByBlocked.bind(this)
      }

    ];

    console.log('setupColumns - columns configuradas:', this.columns);
  }

  // Função de ordenação alfabética simples
  private sortAlphabetically(a: any, b: any): number {
    if (a == null) return 1;
    if (b == null) return -1;
    return String(a).toLowerCase().localeCompare(String(b).toLowerCase(), 'pt-BR');
  }

  // Função de ordenação: primeiro alfabeto, depois numérico
  private sortEnrollment(a: any, b: any): number {
    if (a == null) return 1;
    if (b == null) return -1;

    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();

    // Separa letras de números
    const aLetters = aStr.replace(/[0-9]/g, '');
    const bLetters = bStr.replace(/[0-9]/g, '');
    const aNumbers = aStr.replace(/[^0-9]/g, '');
    const bNumbers = bStr.replace(/[^0-9]/g, '');

    // Compara parte alfabética primeiro
    if (aLetters !== bLetters) {
      return aLetters.localeCompare(bLetters, 'pt-BR');
    }

    // Se alfabeto é igual, compara números
    const aNum = parseInt(aNumbers) || 0;
    const bNum = parseInt(bNumbers) || 0;
    return aNum - bNum;
  }

  // Função de ordenação: por quantidade de grupos
  private sortByGroupCount(groupsA: any, groupsB: any): number {
    // Ambos são arrays de grupos
    const countA = Array.isArray(groupsA) ? groupsA.length : 0;
    const countB = Array.isArray(groupsB) ? groupsB.length : 0;
    return countB - countA; // Decrescente: mais grupos primeiro
  }

  // Função de ordenação: por status (ativo, inativo, bloqueado)
  private sortByBlocked(_: any, __: any, userA: any, userB: any): number {
    const blockedA = userA?.session?.blocked ? 1 : 0;
    const blockedB = userB?.session?.blocked ? 1 : 0;

    // Não bloqueados primeiro
    return blockedA - blockedB;
  }

  private sortByOnlineStatus(_: any, __: any, userA: any, userB: any): number {
    const onlineA = userA?.session?.isOnline ? 1 : 0;
    const onlineB = userB?.session?.isOnline ? 1 : 0;

    // Online primeiro
    return onlineB - onlineA;
  }

  // Helper: determina o status do usuário
  private getUserStatus(user: any): string {
    if (user?.blocked) return 'bloqueado';
    if (user?.session?.isOnline) return 'ativo';
    return 'inativo';
  }

  private loadTranslations(): void {
  }

  private loadUsers(): void {
    this.firebaseService.subscribe('users', (users: any[]) => {
      this.users = users || [];
      this.addGroupDetailsToUsers();
      this.sortUsersByEnrollment();
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
    if (this.defaultList) {
      this.defaultList.clearSelection();
      this.onSelectionChange([user]);
      this.defaultList.selectedItems.add(user.enrollment);
    }
  }
}
