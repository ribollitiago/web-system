import { Component, Input } from '@angular/core';
import { TranslationService } from '../../../../core/services/shared/translate.service';

@Component({
  selector: 'app-status-chip',
  templateUrl: './status-chip.component.html',
  styleUrls: ['./status-chip.component.scss']
})
export class StatusChipComponent {

  @Input() isOnline?: boolean;

  constructor(private translationService: TranslationService) {}

  getIcon(): string {
    return this.isOnline
      ? 'assets/svg/icon/users/situation-actived.svg'
      : 'assets/svg/icon/users/situation-inactived.svg';
  }

  getLabel(): string {
    return this.isOnline
      ? this.translationService.getTranslation('status.online', 'users_page')
      : this.translationService.getTranslation('status.offline', 'users_page');
  }
}
