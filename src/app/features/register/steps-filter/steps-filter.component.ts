import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TranslationService } from '../../../core/services/translate.service';
import { Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-steps-filter',
  imports: [CommonModule, FormsModule],
  templateUrl: './steps-filter.component.html',
  styleUrls: ['./steps-filter.component.scss']
})
export class StepsFilterComponent implements OnChanges, OnDestroy {
  @Input() selectedFilter: string = 'users';
  @Input() searchQuery: string = '';
  @Output() permissionSelected = new EventEmitter<any>();

  menuTooltip: string = '';
  zeroTooltip: string = '';
  lowTooltip: string = '';
  mediumTooltip: string = '';
  highTooltip: string = '';

  filteredList: any[] = [];
  resolvedList: any[] = [];
  openedMenuId: number | null = null;
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
          checked: this.permissionsService.getSelectedPermissions()[item.id] || false
        }));
        break;
      case 'admin':
        this.resolvedList = Object.values(this.permissions.admin).map((item: any) => ({
          ...item,
          checked: this.permissionsService.getSelectedPermissions()[item.id] || false
        }));
        break;
      default:
        this.resolvedList = Object.values(this.permissions.users).map((item: any) => ({
          ...item,
          checked: this.permissionsService.getSelectedPermissions()[item.id] || false
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
    if (this.openedMenuId !== null) {
      this.removeDocumentClickListener();
    }
    this.openedMenuId = this.openedMenuId === id ? null : id;
    if (this.openedMenuId !== null) {
      this.addDocumentClickListener();
    }
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

  toggleAndChange(item: any) {
    item.checked = !item.checked;
    this.onCheckboxChange(item);
  }

  onCheckboxChange(item: any) {
    this.permissionsService.setSelectedPermission(item.id, item.checked);
    const selectedPermissions = this.filteredList.filter(i => i.checked);
    this.permissionSelected.emit(selectedPermissions);
    console.log('Checkbox alterado:', item);
  }

  onMouseEnterCritical(id: number): void {
    this.hoveredCriticalId = id;
  }

  onMouseLeaveCritical(): void {
    this.hoveredCriticalId = null;
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
}
