// main-layout.component.ts
import { Component, HostListener, input, signal } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router'; // Add this import

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    RouterOutlet // Add this to imports array
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isLeftSidebarCollapsed = signal(false);
  isMobileCollapse = signal(false); // New signal to track auto-collapse
  screenWidth = signal<number>(window.innerWidth);

  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
    if(this.screenWidth() < 768) {
      this.isMobileCollapse.set(true);
      this.isLeftSidebarCollapsed.set(true);
    } else {
      this.isMobileCollapse.set(false);
      // Restore previous state when returning to desktop
      if(this.isLeftSidebarCollapsed()) {
        this.isLeftSidebarCollapsed.set(false);
      }
    }
  }

  changeIsLeftSidebarCollapsed(state: boolean) {
    if(!this.isMobileCollapse()) { // Only allow manual changes on desktop
      this.isLeftSidebarCollapsed.set(state);
    }
  }
}
