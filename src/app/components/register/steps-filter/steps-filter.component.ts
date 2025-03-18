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
  menuTooltip: string = '';
  zeroTooltip: string = '';
  lowTooltip: string = '';
  mediumTooltip: string = '';
  highTooltip: string = '';

  @Input() selectedFilter: string = 'users';
  @Input() searchQuery: string = '';

  showExtraTooltip = false;

  constructor(private permissionsservice: PermissionsService, private translationService: TranslationService,) {}

  filteredList: any[] = [];
  resolvedList: any[] = [];
  openedMenuId: number | null = null;
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

  toggleMenu(id: number): void {
    this.openedMenuId = this.openedMenuId === id ? null : id;
  }

  clickedOutside(): void {
    this.openedMenuId = null;
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

  onMouseEnterCritical(id: number): void {
    this.hoveredCriticalId = id;
  }

  onMouseLeaveCritical(): void {
    this.hoveredCriticalId = null;
  }
}
