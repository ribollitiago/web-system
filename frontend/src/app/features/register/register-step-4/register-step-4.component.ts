// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { TranslationService } from '../../../core/services/shared/translate.service';
import { RegisterService } from '../../../core/services/components/register.service';
import { PermissionsService } from '../../../core/services/components/permissions.service';

import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';
import { GroupChipComponent } from "../../../shared/components/chip/group-chip/group-chip.component";
import { GroupsService } from '../../../core/services/components/groups.service';
import { DefaultPopupComponent } from "../../../shared/components/popup/default-popup/default-popup.component";


// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
@Component({
  selector: 'app-register-step-4',
  standalone: true,
  imports: [
    DefaultStepComponent,
    CommonModule,
    MatTooltipModule,
    MatMenuModule,
    GroupChipComponent,
    DefaultPopupComponent
  ],
  templateUrl: './register-step-4.component.html',
  styleUrl: './register-step-4.component.scss'
})
export class RegisterStep4Component {

  @ViewChild(DefaultPopupComponent) popup!: DefaultPopupComponent;

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------
  isLoading = false;
  registrationData: any = {};
  permissionUserSelected: any;

  selectedGroupsDetails: any[] = [];

  // ------------------------------------------------------
  // TEXTOS (TRADUÇÃO)
  // ------------------------------------------------------
  title = '';
  subtitle = '';
  stepOne = '';
  stepTwo = '';
  stepThree = '';
  btnRegister = '';

  titleName = '';
  titleEmail = '';
  titlePhone = '';
  titleEnrollment = '';

  attachment = '';
  btnAttachment = '';

  menuTooltip = '';
  zeroTooltip = '';
  lowTooltip = '';
  mediumTooltip = '';
  highTooltip = '';

  //DialogBox
  dialogTitle = '';
  dialogDescription = '';
  dialogBtnLeft = '';
  dialogBtnRight = '';

  popupBtnLeftColor = 'var(--dialog-btn-left)';
  popupBtnRightColor = 'var(--dialog-btn-right)';


  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------
  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private router: Router,
    private permissionsService: PermissionsService,
    private groupsService: GroupsService
  ) { }

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    this.registerService.data$.subscribe(allData => {
      this.registrationData = allData['users'] || {};
      this.selectedGroupsDetails = this.groupsService.getSelectedGroups();

      if (this.registrationData.permissions?.length) {
        this.listPermissions(this.registrationData.permissions);
      } else {
        this.permissionUserSelected = [];
      }
    });

    this.listenLanguageChanges();
  }

  // ------------------------------------------------------
  // IDIOMA
  // ------------------------------------------------------
  private listenLanguageChanges(): void {
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
  }

  // ------------------------------------------------------
  // TRADUÇÕES
  // ------------------------------------------------------
  private loadTranslations(): void {
    const section = 'register_page';
    const step1 = 'step_1.';
    const step2 = 'step_2.';
    const step3 = 'step_3.';
    const step4 = 'step_4.';
    const default_ = 'default.';
    const dialogConfirmRegister = "dialog_confirm_register.";

    this.title = this.translationService.getTranslation(step4 + 'title', section);
    this.subtitle = this.translationService.getTranslation(step4 + 'subtitle', section);
    this.btnRegister = this.translationService.getTranslation(step4 + 'btnRegister', section);

    this.stepTwo = this.translationService.getTranslation(default_ + 'stepTwo', section);
    this.stepThree = this.translationService.getTranslation(default_ + 'stepThree', section);

    this.titleName = this.translationService.getTranslation(step1 + 'titleName', section);
    this.titleEmail = this.translationService.getTranslation(step1 + 'titleEmail', section);
    this.titlePhone = this.translationService.getTranslation(step1 + 'titlePhone', section);
    this.titleEnrollment = this.translationService.getTranslation(step1 + 'titleEnrollment', section);

    this.attachment = this.translationService.getTranslation(step3 + 'attachments', section);
    this.btnAttachment = this.translationService.getTranslation(step3 + 'btnAttachment', section);

    this.menuTooltip = this.translationService.getTranslation(step2 + 'menuTooltip', section);
    this.zeroTooltip = this.translationService.getTranslation(step2 + 'criticalTooltipZeroLevel', section);
    this.lowTooltip = this.translationService.getTranslation(step2 + 'criticalTooltipLowLevel', section);
    this.mediumTooltip = this.translationService.getTranslation(step2 + 'criticalTooltipMediumLevel', section);
    this.highTooltip = this.translationService.getTranslation(step2 + 'criticalTooltipHighLevel', section);

    this.dialogTitle = this.translationService.getTranslation(dialogConfirmRegister + 'title', section);
    this.dialogDescription = this.translationService.getTranslation(dialogConfirmRegister + 'description', section);
    this.dialogBtnLeft = this.translationService.getTranslation(dialogConfirmRegister + 'buttonLeftTitle', section);
    this.dialogBtnRight = this.translationService.getTranslation(dialogConfirmRegister + 'buttonRightTitle', section);
  }

  // ------------------------------------------------------
  // PERMISSÕES
  // ------------------------------------------------------
  private sortByCriticalLevel(permissions: any[]): void {
    const levelOrder: Record<string, number> = {
      HIGH_LEVEL: 0,
      MEDIUM_LEVEL: 1,
      LOW_LEVEL: 2,
      ZERO_LEVEL: 3
    };

    permissions.sort((a, b) => {
      const aOrder = levelOrder[a.critical] ?? 3;
      const bOrder = levelOrder[b.critical] ?? 3;
      return aOrder - bOrder;
    });
  }

  async listPermissions(permissionIds: string[]): Promise<void> {
    const filtered = this.permissionsService.filterPermissionsByIds(
      await this.permissionsService.getPermissions(),
      permissionIds
    );

    const permissions: any[] = [];

    Object.keys(filtered).forEach(category => {
      const categoryPermissions = filtered[category as keyof typeof filtered];

      if (categoryPermissions && Object.keys(categoryPermissions).length > 0) {
        Object.values(categoryPermissions).forEach(permission => {
          if (permission.title) {
            permissions.push({
              title: permission.title,
              critical: permission.critical,
              description: permission.description
            });
          }
        });
      }
    });

    this.sortByCriticalLevel(permissions);
    this.permissionUserSelected = permissions;
  }

  // ------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------
  getSvgFileName(critical: string): string {
    const mapping: Record<string, string> = {
      HIGH_LEVEL: 'high_level.svg',
      MEDIUM_LEVEL: 'medium_level.svg',
      LOW_LEVEL: 'low_level.svg',
      ZERO_LEVEL: 'zero_level.svg'
    };

    return `assets/svg/icon/register/step-2/${mapping[critical] || 'default.svg'}`;
  }

  getCriticalText(critical: string): string {
    switch (critical) {
      case 'HIGH_LEVEL': return this.highTooltip;
      case 'MEDIUM_LEVEL': return this.mediumTooltip;
      case 'LOW_LEVEL': return this.lowTooltip;
      case 'ZERO_LEVEL': return this.zeroTooltip;
      default: return '';
    }
  }

  // ------------------------------------------------------
  // NAVEGAÇÃO
  // ------------------------------------------------------
  return(): void {
    this.registerService.previousStep('users');
  }

  confirmRegistration(): void {
    this.registerService.register('users')
      .then(() => this.router.navigate(['/home']))
      .catch(() => { });
  }

  handleOpenDialog() {
    this.popup.open();
  }
}
