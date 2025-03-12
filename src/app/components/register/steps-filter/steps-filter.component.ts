import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-steps-filter',
  imports: [CommonModule],
  templateUrl: './steps-filter.component.html',
  styleUrl: './steps-filter.component.scss'
})
export class StepsFilterComponent {
  @Input() selectedFilter: string = 'users';

  users = [
    { id: 1, name: 'User 1', description: "extra information 1", critical: 'HIGH_LEVEL'},
    { id: 2, name: 'User 2', description: "extra information 2", critical: 'HIGH_LEVEL'},
    { id: 3, name: 'User 3', description: "extra information 3", critical: 'HIGH_LEVEL' },
    { id: 4, name: 'User 4', description: "extra information 4", critical: 'MEDIUM_LEVEL' },
    { id: 5, name: 'User 5', description: "extra information 5", critical: 'HIGH_LEVEL' },
    { id: 6, name: 'User 6', description: "extra information 6", critical: 'HIGH_LEVEL' },
    { id: 7, name: 'User 7', description: "extra information 7", critical: 'LOW_LEVEL' },
    { id: 8, name: 'User 8', description: "extra information 8", critical: 'HIGH_LEVEL' },
    { id: 9, name: 'User 9', description: "extra information 9", critical: 'ZERO_LEVEL' },
    { id: 10, name: 'User 10', description: "extra information 10", critical: 'HIGH_LEVEL' },
  ];

  routes = [
    { id: 1, name: 'routes 1', description: "extra information", critical: 'LOW_LEVEL'},
    { id: 2, name: 'routes 2', description: "extra information", critical: 'HIGH_LEVEL'},
    { id: 3, name: 'routes 3', description: "extra information", critical: 'HIGH_LEVEL' },
    { id: 4, name: 'routes 4', description: "extra information", critical: 'MEDIUM_LEVEL' },
    { id: 5, name: 'routes 5', description: "extra information", critical: 'HIGH_LEVEL' },
    { id: 6, name: 'routes 6', description: "extra information", critical: 'LOW_LEVEL' },
    { id: 7, name: 'routes 7', description: "extra information", critical: 'LOW_LEVEL' },
    { id: 8, name: 'routes 8', description: "extra information", critical: 'HIGH_LEVEL' },
    { id: 9, name: 'routes 9', description: "extra information", critical: 'ZERO_LEVEL' },
    { id: 10, name: 'routes 10', description: "extra information", critical: 'HIGH_LEVEL' },
  ];

  admin = [
    { id: 1, name: 'admin 1', description: "extra information", critical: 'MEDIUM_LEVEL'},
    { id: 2, name: 'admin 2', description: "extra information", critical: 'HIGH_LEVEL'},
    { id: 3, name: 'admin 3', description: "extra information", critical: 'MEDIUM_LEVEL' },
    { id: 4, name: 'admin 4', description: "extra information", critical: 'MEDIUM_LEVEL' },
    { id: 5, name: 'admin 5', description: "extra information", critical: 'HIGH_LEVEL' },
    { id: 6, name: 'admin 6', description: "extra information", critical: 'HIGH_LEVEL' },
    { id: 7, name: 'admin 7', description: "extra information", critical: 'LOW_LEVEL' },
    { id: 8, name: 'admin 8', description: "extra information", critical: 'HIGH_LEVEL' },
    { id: 9, name: 'admin 9', description: "extra information", critical: 'ZERO_LEVEL' },
    { id: 10, name: 'admin 10', description: "extra information", critical: 'HIGH_LEVEL' },
  ];

  openedMenuId: number | null = null;

  get currentList() {
    switch (this.selectedFilter) {
      case 'route':
        return this.routes;
      case 'admin':
        return this.admin;
      default:
        return this.users;
    }
  }

  getSvgFileName(critical: string): string {
    const mapping: { [key: string]: string } = {
      HIGH_LEVEL: 'high_level.svg',
      MEDIUM_LEVEL: 'medium_level.svg',
      LOW_LEVEL: 'low_level.svg',
      ZERO_LEVEL: 'zero_level.svg'
    };

    return mapping[critical] || 'default.svg'; // Usa 'default.svg' se o nível não estiver no mapeamento
  }

  toggleMenu(id: number): void {
    this.openedMenuId = this.openedMenuId === id ? null : id;
  }

  clickedOutside(): void {
    this.openedMenuId = null;
  }
}
