import { Component, Input, OnChanges } from '@angular/core';
import { TranslationService } from '../../../../core/services/shared/translate.service';
import { UserSession } from '../../../../core/services/session/session.types';
import { resolveConnectionState } from '../../../../core/utils/connection.utils';
import { UserConnectionState, USER_CONNECTION_STATE } from '../../../../core/services/session/connection-state.enum';

@Component({
  selector: 'app-situation-chip',
  templateUrl: './situation-chip.component.html',
  styleUrl: './situation-chip.component.scss'
})
export class SituationChipComponent implements OnChanges {

  constructor(private translationService: TranslationService) {}

  @Input() session?: UserSession | null;
  @Input() blocked?: boolean;

  state: UserConnectionState = USER_CONNECTION_STATE.OFFLINE;

  ngOnChanges() {
    this.state = resolveConnectionState(this.session, this.blocked);
  }

  get icon(): string {
    const iconMap: Record<number, string> = {
      [USER_CONNECTION_STATE.ONLINE]: 'situation-actived.svg',
      [USER_CONNECTION_STATE.OFFLINE]: 'situation-inactived.svg',
      [USER_CONNECTION_STATE.BLOCKED]: 'situation-disabled.svg',
    };

    return `assets/svg/icon/users/${iconMap[this.state]}`;
  }

  get label(): string {
    const translationMap: Record<number, string> = {
      [USER_CONNECTION_STATE.ONLINE]: 'actived',
      [USER_CONNECTION_STATE.OFFLINE]: 'inactived',
      [USER_CONNECTION_STATE.BLOCKED]: 'disabled'
    };

    return this.translationService.getTranslation(
      translationMap[this.state],
      'Users_Page'
    );
  }
}
