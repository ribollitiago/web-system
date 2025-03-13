import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { PermissionsService } from '../../../services/permissions.service';

@Component({
  selector: 'app-steps-filter',
  imports: [CommonModule],
  templateUrl: './steps-filter.component.html',
  styleUrl: './steps-filter.component.scss'
})
export class StepsFilterComponent implements OnChanges {
  @Input() selectedFilter: string = 'users';
  @Input() searchQuery: string = '';

  showExtraTooltip = false;

  constructor(private permissionsservice: PermissionsService) {}

  filteredList: any[] = [];
  resolvedList: any[] = [];
  openedMenuId: number | null = null;
  hoveredCriticalId: number | null = null;
  permissions: any = null;

  async ngOnInit() {
    this.permissions = await this.permissionsservice.getPermissions();
    this.updateCurrentList();
    this.applySearchFilter();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFilter'] && this.permissions) {
      this.updateCurrentList();
    }
    if (changes['searchQuery']) {
      this.applySearchFilter();
    }
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

    this.applySearchFilter(); // Aplicar filtro após atualizar a lista
  }

  private applySearchFilter() {
    const searchTerm = this.searchQuery.toLowerCase();

    this.filteredList = this.resolvedList.filter(item =>
      item.title.toLowerCase().includes(searchTerm)
    );
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
      case 'HIGH_LEVEL': return 'Risco Alto';
      case 'MEDIUM_LEVEL': return 'Risco Médio';
      case 'LOW_LEVEL': return 'Risco Baixo';
      case 'ZERO_LEVEL': return 'Sem Risco';
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
