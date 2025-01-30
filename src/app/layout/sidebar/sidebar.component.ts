import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() isLeftSidebarCollapsed: boolean = false;
  @Output() changeIsLeftSidebarCollapsed = new EventEmitter<boolean>();

  items = [
    { routeLink: '/home', icon: 'assets/svg/icon/home.svg', label: 'Home' },
    { routeLink: '/register', icon: 'assets/svg/icon/register.svg', label: 'Register' },
    { routeLink: '/users', icon: 'assets/svg/icon/users.svg', label: 'Users' }
  ];

  toggleSidebar() {
    this.isLeftSidebarCollapsed = !this.isLeftSidebarCollapsed;
    this.changeIsLeftSidebarCollapsed.emit(this.isLeftSidebarCollapsed);
  }
}
