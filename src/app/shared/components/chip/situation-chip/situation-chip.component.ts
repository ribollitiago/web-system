import { Component, Input } from '@angular/core';
import { TranslationService } from '../../../../core/services/shared/translate.service';

@Component({
  selector: 'app-situation-chip',
  templateUrl: './situation-chip.component.html',
  styleUrls: ['./situation-chip.component.scss']
})
export class SituationChipComponent {

  @Input() isOnline?: boolean;
  @Input() blocked?: boolean;

  constructor(private translationService: TranslationService) { }

  getSituationIcon(): string {
    if (this.blocked) return 'assets/svg/icon/users/situation-disabled.svg';
    if (this.isOnline) return 'assets/svg/icon/users/situation-actived.svg';
    return 'assets/svg/icon/users/situation-inactived.svg';
  }

  translateSituation(): string {
    if (this.blocked) return this.translationService.getTranslation('disabled', 'Users_Page');
    if (this.isOnline) return this.translationService.getTranslation('actived', 'Users_Page');
    return this.translationService.getTranslation('inactived', 'Users_Page');
  }
}
