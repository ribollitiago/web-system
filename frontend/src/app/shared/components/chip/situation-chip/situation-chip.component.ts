import { Component, Input } from '@angular/core';
import { TranslationService } from '../../../../core/services/shared/translate.service';

@Component({
  selector: 'app-situation-chip',
  templateUrl: './situation-chip.component.html',
  styleUrls: ['./situation-chip.component.scss']
})
export class SituationChipComponent {

  @Input() blocked?: boolean;

  constructor(private translationService: TranslationService) {}

  getIcon(): string {
    return this.blocked
      ? 'assets/svg/icon/users/situation-disabled.svg'
      : 'assets/svg/icon/users/situation-actived.svg';
  }

  getLabel(): string {
    return this.blocked
      ? this.translationService.getTranslation('situation.blocked', 'users_page')
      : this.translationService.getTranslation('situation.noBlocked', 'users_page');
  }
}
