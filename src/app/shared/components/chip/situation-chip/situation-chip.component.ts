import { Component, Input } from '@angular/core';
import { TranslationService } from '../../../../core/services/i18n/translate.service';

@Component({
  selector: 'app-situation-chip',
  imports: [

  ],
  templateUrl: './situation-chip.component.html',
  styleUrl: './situation-chip.component.scss'
})
export class SituationChipComponent {

  constructor(private translationService: TranslationService,) {
  }
  @Input() situation: string | number = '';


  getSituationIcon(situation: string | number): string {
    const sitStr = String(situation);

    const iconMap: Record<string, string> = {
      '2': 'situation-actived.svg',
      '1': 'situation-inactived.svg',
      '0': 'situation-disabled.svg',

    };
    return `assets/svg/icon/users/${iconMap[sitStr] || 'situation-inactived.svg'}`;
  }

  translateSituation(situation: string | number): string {
    const sitStr = String(situation);
    const situationMap: Record<string, string> = {
      '2': 'actived',
      '1': 'inactived',
      '0': 'disabled'
    };
    return this.translationService.getTranslation(situationMap[sitStr], 'Users_Page');
  }
}
