import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslationService } from './services/translate.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'internal-system';

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    const currentLanguage = this.translationService.getCurrentLanguage();
    if (!currentLanguage) {
      this.translationService.setLanguage(currentLanguage);
    }

    this.translationService.language$.subscribe(language => {
      console.log(`Language changed to: ${language}`);
    });
  }
}
