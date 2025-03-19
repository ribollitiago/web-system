import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { PermissionsService } from '../../../services/permissions.service';
import { TranslationService } from '../../../services/translate.service';

@Component({
  selector: 'app-steps-filter',
  imports: [CommonModule],
  templateUrl: './steps-filter.component.html',
  styleUrl: './steps-filter.component.scss'
})
export class StepsFilterComponent implements OnChanges {
  constructor(private permissionsservice: PermissionsService, private translationService: TranslationService,) {}

  @Input() selectedFilter: string = 'users';
  @Input() searchQuery: string = '';

  menuTooltip: string = '';
  zeroTooltip: string = '';
  lowTooltip: string = '';
  mediumTooltip: string = '';
  highTooltip: string = '';
  showExtraTooltip = false;
  filteredList: any[] = [];
  resolvedList: any[] = [];
  openedMenuId: number | null = null;
  private clickListener?: (event: MouseEvent) => void;
  hoveredCriticalId: number | null = null;
  permissions: any = null;

  async ngOnInit() {
    this.permissions = await this.permissionsservice.getPermissions();
    this.updateCurrentList();
    this.applySearchFilter();
    this.sortByCriticalLevel();
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFilter'] && this.permissions) {
      this.updateCurrentList();
    }
    if (changes['searchQuery']) {
      this.applySearchFilter();
    }
    this.sortByCriticalLevel();
  }

  ngOnDestroy(): void {
    this.removeDocumentClickListener();
  }

  loadTranslations() {
    const section = 'Permissions_Page';
    this.menuTooltip = this.translationService.getTranslation('menuTooltip', section);
    this.zeroTooltip = this.translationService.getTranslation('criticalTooltipZeroLevel', section);
    this.lowTooltip = this.translationService.getTranslation('criticalTooltipLowLevel', section);
    this.mediumTooltip = this.translationService.getTranslation('criticalTooltipMediumLevel', section);
    this.highTooltip = this.translationService.getTranslation('criticalTooltipHighLevel', section);
  }

  updateCurrentList() {
    switch (this.selectedFilter) {
      case 'route':
        this.resolvedList = Object.values(this.permissions.routes);
        break;
      case 'admin':
        this.resolvedList = Object.values(this.permissions.admin);
        break;
      default:
        this.resolvedList = Object.values(this.permissions.users);
        break;
    }
    this.applySearchFilter();
    this.sortByCriticalLevel();
  }

  private applySearchFilter() {
    const searchTerm = this.searchQuery.toLowerCase();
    this.filteredList = this.resolvedList.filter(item =>
      item.title.toLowerCase().includes(searchTerm)
    );
  }

  private sortByCriticalLevel() {
    const levelOrder = {
      'HIGH_LEVEL': 0,
      'MEDIUM_LEVEL': 1,
      'LOW_LEVEL': 2,
      'ZERO_LEVEL': 3
    };

  }

  getSvgFileName(critical: string): string {
    const mapping: { [key: string]: string } = {
      HIGH_LEVEL: 'high_level.svg',
      MEDIUM_LEVEL: 'medium_level.svg',
      LOW_LEVEL: 'low_level.svg',
      ZERO_LEVEL: 'zero_level.svg'
    };
    return mapping[critical] || 'default.svg';
  }

  getCriticalText(critical: string): string {
    switch (critical) {
      case 'HIGH_LEVEL': return this.highTooltip;
      case 'MEDIUM_LEVEL': return this.mediumTooltip;
      case 'LOW_LEVEL': return this.lowTooltip;
      case 'ZERO_LEVEL': return this.zeroTooltip;
      default: return '';
    }
  }

  private addDocumentClickListener(): void {
    this.clickListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const openMenu = document.querySelector('.menu:not([hidden])');
      const iconWrapper = openMenu?.previousElementSibling;
      const clickedInsideMenu = openMenu?.contains(target);
      const clickedOnIcon = iconWrapper?.contains(target);

      if (!clickedInsideMenu && !clickedOnIcon) {
        this.openedMenuId = null;
        this.removeDocumentClickListener();
      }
    };

    setTimeout(() => {
      document.addEventListener('click', this.clickListener!);
    }, 0);
  }

  private removeDocumentClickListener(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = undefined;
    }
  }

  toggleMenu(itemId: number): void {
    if (this.openedMenuId !== null) {
      this.removeDocumentClickListener();
    }
    this.openedMenuId = this.openedMenuId === itemId ? null : itemId;
    if (this.openedMenuId !== null) {
      this.addDocumentClickListener();
    }
  }

  onMouseEnterCritical(id: number): void {
    this.hoveredCriticalId = id;
  }

  onMouseLeaveCritical(): void {
    this.hoveredCriticalId = null;
  }
}
