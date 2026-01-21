import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TranslationService } from '../../../core/services/translate.service';
import { Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-steps-filter',
  imports: [CommonModule, FormsModule, MatTooltipModule, MatMenuModule],
  templateUrl: './steps-filter.component.html',
  styleUrls: ['./steps-filter.component.scss']
})
export class StepsFilterComponent implements OnChanges, OnDestroy {
  @Input() selectedFilter: string = 'users';
  @Input() searchQuery: string = '';
  @Input() lockedPermissions = new Set<string>();
  @Output() permissionSelected = new EventEmitter<any>();

  menuTooltip: string = '';
  zeroTooltip: string = '';
  lowTooltip: string = '';
  mediumTooltip: string = '';
  highTooltip: string = '';

  filteredList: any[] = [];
  resolvedList: any[] = [];
  hoveredCriticalId: number | null = null;
  showExtraTooltip = false;

  private clickListener?: (event: MouseEvent) => void;
  private permissions: any = null;

  constructor(
    private permissionsService: PermissionsService,
    private translationService: TranslationService
  ) { }

  async ngOnInit() {
    this.permissions = await this.permissionsService.getPermissions();
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
        this.resolvedList = Object.values(this.permissions.routes).map((item: any) => ({
          ...item,
          checked: this.permissionsService.getSelectedPermissions()[item.id] ?? false
        }));
        break;
      case 'admin':
        this.resolvedList = Object.values(this.permissions.admin).map((item: any) => ({
          ...item,
          checked: this.permissionsService.getSelectedPermissions()[item.id] ?? false
        }));
        break;
      default:
        this.resolvedList = Object.values(this.permissions.users).map((item: any) => ({
          ...item,
          checked: this.permissionsService.getSelectedPermissions()[item.id] ?? false
        }));
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
    const levelOrder: { [key: string]: number } = {
      'HIGH_LEVEL': 0,
      'MEDIUM_LEVEL': 1,
      'LOW_LEVEL': 2,
      'ZERO_LEVEL': 3
    };

    this.filteredList.sort((a, b) => {
      const aOrder = levelOrder[a.critical] ?? 3;
      const bOrder = levelOrder[b.critical] ?? 3;
      return aOrder - bOrder;
    });
  }

  getCriticalText(level: string): string {
    switch (level) {
      case 'ZERO_LEVEL': return this.zeroTooltip;
      case 'LOW_LEVEL': return this.lowTooltip;
      case 'MEDIUM_LEVEL': return this.mediumTooltip;
      case 'HIGH_LEVEL': return this.highTooltip;
      default: return '';
    }
  }

  getSvgFileName(level: string): string {
    switch (level) {
      case 'ZERO_LEVEL': return 'zero_level.svg';
      case 'LOW_LEVEL': return 'low_level.svg';
      case 'MEDIUM_LEVEL': return 'medium_level.svg';
      case 'HIGH_LEVEL': return 'high_level.svg';
      default: return '';
    }
  }
  
  getCheckboxIcon(item: any): string {
    if (this.lockedPermissions?.has(item.id)) {
      return 'check-on.svg';
    }

    return item.checked ? 'check-on.svg' : 'check-off.svg';
  }

  toggleAndChange(item: any) {
    if (this.lockedPermissions.has(item.id)) {
      return;
    }

    item.checked = !item.checked;
    this.permissionSelected.emit(item);
  }

  removeDocumentClickListener() {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = undefined;
    }
  }
}
