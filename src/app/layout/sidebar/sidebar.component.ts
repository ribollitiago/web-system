import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PrimaryInputComponent } from "../../components/primary-input/primary-input.component";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, PrimaryInputComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  placeholderSearch: string = 'Search...';

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
