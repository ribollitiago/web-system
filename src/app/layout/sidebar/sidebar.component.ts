import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, ViewChild, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { TranslationService } from '../../core/services/i18n/translate.service';
import { filter, Subscription } from 'rxjs';

interface SidebarItem {
  routeLink?: string;
  icon: string;
  label: string;
  submenu?: boolean;
  isOpen?: boolean;
  itemsSubMenu?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, SearchInputComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [TranslationService]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isLeftSidebarCollapsed: boolean = false;
  @Output() changeIsLeftSidebarCollapsed = new EventEmitter<boolean>();
  @ViewChild(SearchInputComponent) searchInputComponent!: SearchInputComponent;

  tooltipMenuClose: string = '';
  tooltipMenuOpen: string = '';
  inputSearchValue: string = '';
  inputSearch: string = '';
  linkHome: string = '';
  linkRegister: string = '';
  linkUsers: string = '';
  linkListUsers: string = '';
  linkAnalytics: string = '';

  openedSubmenuIndex: number | null = null;
  activeParentIndex: number | null = null;
  private routerSubscription: Subscription;
  private readonly CLOSED_SUBMENUS_KEY = 'closedSubmenus';
  private closedSubmenus = new Set<number>();

  items: SidebarItem[] = [];

  constructor(
    private translationService: TranslationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateActiveParent());
  }

  ngOnInit() {
    this.loadClosedSubmenus();
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
      this.updateActiveParent();
    });
    this.loadTranslations();
    this.updateActiveParent();
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  onSearchInput(value: string) {
    this.inputSearchValue = value;
    this.cdr.detectChanges();
    if (value) {
      this.openedSubmenuIndex = null;
    } else {
      this.updateActiveParent();
    }
  }

  highlightMatches(text: string): string {
    if (!this.inputSearchValue) return text;
    const regex = new RegExp(this.inputSearchValue, 'gi');
    return text.replace(regex, match => `<span class="highlight">${match}</span>`);
  }

  get filteredItems(): SidebarItem[] {
    if (!this.inputSearchValue?.trim()) {
      return this.items;
    }

    const searchTerm = this.inputSearchValue.toLowerCase();
    return this.items
      .filter(item => {
        const matchesLabel = item.label.toLowerCase().includes(searchTerm);
        const hasMatchingSubItems = item.itemsSubMenu?.some(subItem =>
          subItem.label.toLowerCase().includes(searchTerm)
        );
        return matchesLabel || hasMatchingSubItems;
      })
      .map(item => {
        if (!item.submenu) return item;
        return {
          ...item,
          itemsSubMenu: item.itemsSubMenu?.filter(subItem =>
            subItem.label.toLowerCase().includes(searchTerm)
          )
        };
      });
  }


  shouldOpenSubmenu(item: SidebarItem, index: number): boolean {
    if (this.isLeftSidebarCollapsed) return false;
    if (this.inputSearchValue) {
      return !!item.itemsSubMenu?.length;
    }
    return this.openedSubmenuIndex === index;
  }

  private loadClosedSubmenus() {
    const closed = localStorage.getItem(this.CLOSED_SUBMENUS_KEY);
    if (closed) {
      this.closedSubmenus = new Set(JSON.parse(closed));
    }
  }

  private saveClosedSubmenus() {
    localStorage.setItem(this.CLOSED_SUBMENUS_KEY, JSON.stringify(Array.from(this.closedSubmenus)));
  }

  toggleSubmenu(index: number): void {
    if (this.openedSubmenuIndex === index) {
      this.closedSubmenus.add(index);
      this.openedSubmenuIndex = null;
    } else {
      this.closedSubmenus.delete(index);
      this.openedSubmenuIndex = index;
    }
    this.saveClosedSubmenus();
  }

  private updateActiveParent() {
    this.activeParentIndex = null;
    this.filteredItems.forEach((item, index) => {
      if (item.submenu && this.isSubItemActive(item.itemsSubMenu)) {
        this.activeParentIndex = index;
        if (!this.isLeftSidebarCollapsed && !this.inputSearchValue) {
          this.openedSubmenuIndex = index;
        }
      }
    });
  }

  private isSubItemActive(subItems: SidebarItem[] | undefined): boolean {
    return subItems?.some(subItem =>
      subItem.routeLink && this.router.isActive(subItem.routeLink, true)
    ) || false;
  }

  loadTranslations() {
    const section = "Sidebar";
    try {
      this.tooltipMenuClose = this.translationService.getTranslation('tooltipMenuClose', section);
      this.tooltipMenuOpen = this.translationService.getTranslation('tooltipMenuOpen', section);
      this.linkHome = this.translationService.getTranslation('linkHome', section);
      this.linkRegister = this.translationService.getTranslation('linkRegister', section);
      this.linkUsers = this.translationService.getTranslation('linkUsers', section);
      this.linkListUsers = this.translationService.getTranslation('linkListUsers', section);
      this.linkAnalytics = this.translationService.getTranslation('linkAnalytics', section);

      this.items = [...this.createItems()]
    } catch (error) {
      console.error('Error loading sidebar translations:', error);
    }

    const section2 = 'Global_Components';
    this.inputSearch = this.translationService.getTranslation('inputSearch', section2);
  }

  private createItems(): SidebarItem[] {
    return [
      {
        routeLink: '/home',
        icon: 'assets/svg/icon/sidebar/home.svg',
        label: this.linkHome
      },
      {
        icon: 'assets/svg/icon/sidebar/users.svg',
        label: this.linkUsers,
        submenu: true,
        itemsSubMenu: [
          {
            routeLink: '/register',
            icon: 'assets/svg/icon/sidebar/register.svg',
            label: this.linkRegister,
          },
          {
            routeLink: '/users',
            icon: 'assets/svg/icon/sidebar/listofusers.svg',
            label: this.linkListUsers
          },
          {
            routeLink: '/subitem2',
            icon: 'assets/svg/icon/sidebar/analytics.svg',
            label: this.linkAnalytics
          },

        ],
      },
      {
        icon: 'assets/svg/icon/sidebar/storage.svg',
        label: 'Stock',
        submenu: true,
        itemsSubMenu: [
          {
            routeLink: '/subitem2',
            icon: 'assets/svg/icon/sidebar/analytics.svg',
            label: "Register"
          },
          {
            routeLink: '/aaa',
            icon: 'assets/svg/icon/sidebar/listofusers.svg',
            label: "List of storage"
          },
        ],
      },
    ];
  }

  handleSearchIconClick() {
    if (this.isLeftSidebarCollapsed) {
      this.toggleSidebar();
      setTimeout(() => this.searchInputComponent.focusInput(), 200);
    }
  }

  toggleSidebar() {
    this.isLeftSidebarCollapsed = !this.isLeftSidebarCollapsed;
    if (this.isLeftSidebarCollapsed) {
      this.openedSubmenuIndex = null;
    } else {
      this.updateActiveParent();
    }
    this.changeIsLeftSidebarCollapsed.emit(this.isLeftSidebarCollapsed);
  }
}
