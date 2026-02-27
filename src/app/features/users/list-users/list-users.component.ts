import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslationService } from '../../../core/services/shared/translate.service';
import { UsersService, User } from '../../../core/services/components/users.service';

import { SituationChipComponent } from '../../../shared/components/chip/situation-chip/situation-chip.component';
import { GroupChipComponent } from '../../../shared/components/chip/group-chip/group-chip.component';
import { StatusChipComponent } from "../../../shared/components/chip/status-chip/status-chip.component";
import { DefaultListComponent, ColumnConfig } from '../../../shared/layout/default-list/default-list.component';

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SituationChipComponent,
    GroupChipComponent,
    DefaultListComponent,
    StatusChipComponent
  ],
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
  filteredUsers: User[] = [];

  private languageSubscription: Subscription;

  constructor(
    private translationService: TranslationService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.setupColumns();
    });
  }

  async ngOnInit() {
    this.setupColumns();

    this.users = await this.usersService.subscribe();
    this.filteredUsers = [...this.users];

    this.filteredUsersCount.emit(this.filteredUsers.length);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery']) {
      this.filterUsers();
    }
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
    this.usersService.unSubscribe();
  }

  // ------------------------------------------------------
  // COLUMNS
  // ------------------------------------------------------

  private setupColumns(): void {
    this.columns = [
      {
        key: 'enrollment',
        label: 'Matrícula',
        flex: '0 0 80px',
        sortFn: this.sortEnrollment.bind(this)
      },
      {
        key: 'name',
        label: this.translationService.getTranslation('filterName', 'users_page'),
        flex: '3 1 13%',
        sortFn: this.sortAlphabetically.bind(this)
      },
      {
        key: 'email',
        label: 'Email',
        flex: '3 1 18%',
        sortFn: this.sortAlphabetically.bind(this)
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
  }

  // ------------------------------------------------------
  // SORT FUNCTIONS
  // ------------------------------------------------------

  private sortAlphabetically(a: any, b: any): number {
    if (a == null) return 1;
    if (b == null) return -1;
    return String(a).toLowerCase().localeCompare(String(b).toLowerCase(), 'pt-BR');
  }

  private sortEnrollment(a: any, b: any): number {
    if (a == null) return 1;
    if (b == null) return -1;

    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();

    const aLetters = aStr.replace(/[0-9]/g, '');
    const bLetters = bStr.replace(/[0-9]/g, '');
    const aNumbers = aStr.replace(/[^0-9]/g, '');
    const bNumbers = bStr.replace(/[^0-9]/g, '');

    if (aLetters !== bLetters) {
      return aLetters.localeCompare(bLetters, 'pt-BR');
    }

    const aNum = parseInt(aNumbers) || 0;
    const bNum = parseInt(bNumbers) || 0;
    return aNum - bNum;
  }

  private sortByGroupCount(groupsA: any, groupsB: any): number {
    const countA = Array.isArray(groupsA) ? groupsA.length : 0;
    const countB = Array.isArray(groupsB) ? groupsB.length : 0;
    return countB - countA;
  }

  private sortByBlocked(_: any, __: any, userA: User, userB: User): number {
    const blockedA = userA?.session?.blocked ? 1 : 0;
    const blockedB = userB?.session?.blocked ? 1 : 0;
    return blockedA - blockedB;
  }

  private sortByOnlineStatus(_: any, __: any, userA: User, userB: User): number {
    const onlineA = userA?.session?.isOnline ? 1 : 0;
    const onlineB = userB?.session?.isOnline ? 1 : 0;
    return onlineB - onlineA;
  }

  // ------------------------------------------------------
  // FILTER
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // EVENTS
  // ------------------------------------------------------

  onSelectionChange(selected: User[]): void {
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