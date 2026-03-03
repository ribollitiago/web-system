import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslationService } from './core/services/shared/translate.service';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from "./layout/header/header.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'internal-system';
  isLanguageLoaded = false;

  constructor(private translationService: TranslationService) { }

  async ngOnInit() {
    this.translationService.languageLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.isLanguageLoaded = true;
      }
    });

    this.translationService.language$.subscribe(language => {
      console.log(`Language changed to: ${language}`);
    });
  }
}
