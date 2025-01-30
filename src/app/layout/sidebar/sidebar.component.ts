import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PrimaryInputComponent } from "../../components/primary-input/primary-input.component";
import { SearchInputComponent } from "../../components/search-input/search-input.component";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, SearchInputComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
handleIconClick() {
throw new Error('Method not implemented.');
}
  placeholderSearch: string = 'Search...';

  @Input() isLeftSidebarCollapsed: boolean = false;
  @Output() changeIsLeftSidebarCollapsed = new EventEmitter<boolean>();
  @ViewChild(SearchInputComponent) searchInputComponent!: SearchInputComponent;

  items = [
    { routeLink: '/home', icon: 'assets/svg/icon/home.svg', label: 'Home' },
    { routeLink: '/register', icon: 'assets/svg/icon/register.svg', label: 'Register' },
    { routeLink: '/users', icon: 'assets/svg/icon/users.svg', label: 'Users' }
  ];

  handleSearchIconClick() {
    if (this.isLeftSidebarCollapsed) {
      this.toggleSidebar();

      // Wait for sidebar animation before focusing
      setTimeout(() => {
        this.searchInputComponent.focusInput();
      }, 200); // Match sidebar transition duration
    }
  }

  toggleSidebar() {
    this.isLeftSidebarCollapsed = !this.isLeftSidebarCollapsed;
    this.changeIsLeftSidebarCollapsed.emit(this.isLeftSidebarCollapsed);
  }

}
