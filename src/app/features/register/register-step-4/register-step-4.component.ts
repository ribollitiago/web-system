// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { TranslationService } from '../../../core/services/i18n/translate.service';
import { RegisterService } from '../../../core/services/auth/register.service';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';

import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';

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
    MatMenuModule
  ],
  templateUrl: './register-step-4.component.html',
  styleUrl: './register-step-4.component.scss'
})
export class RegisterStep4Component {

  // ------------------------------------------------------
  // STATE
  // ------------------------------------------------------
  isLoading = false;
  registrationData: any = {};
  permissionUserSelected: any;

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

  // ------------------------------------------------------
  // CONSTRUCTOR
  // ------------------------------------------------------
  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private router: Router,
    private permissionsService: PermissionsService
  ) {}

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  ngOnInit(): void {
    this.registrationData = this.registerService.getData('users');
    this.listenLanguageChanges();

    if (this.registrationData.permissions) {
      const ids = Object.keys(this.registrationData.permissions)
        .filter(id => this.registrationData.permissions[id]);
      this.listPermissions(ids);
    }
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
    const resumeSection = 'Resume_Page';
    const registerSection = 'Register_Page';
    const extraSection = 'Extra_info_page';
    const permissionsSection = 'Permissions_Page';

    this.title = this.translationService.getTranslation('title', resumeSection);
    this.subtitle = this.translationService.getTranslation('subtitle', resumeSection);
    this.btnRegister = this.translationService.getTranslation('btnRegister', resumeSection);

    this.stepOne = this.translationService.getTranslation('stepOne', registerSection);
    this.stepTwo = this.translationService.getTranslation('stepTwo', registerSection);
    this.stepThree = this.translationService.getTranslation('stepThree', registerSection);

    this.titleName = this.translationService.getTranslation('titleName', registerSection);
    this.titleEmail = this.translationService.getTranslation('titleEmail', registerSection);
    this.titlePhone = this.translationService.getTranslation('titlePhone', registerSection);
    this.titleEnrollment = this.translationService.getTranslation('titleEnrollment', registerSection);

    this.attachment = this.translationService.getTranslation('attachments', extraSection);
    this.btnAttachment = this.translationService.getTranslation('btnAttachment', extraSection);

    this.menuTooltip = this.translationService.getTranslation('menuTooltip', permissionsSection);
    this.zeroTooltip = this.translationService.getTranslation('criticalTooltipZeroLevel', permissionsSection);
    this.lowTooltip = this.translationService.getTranslation('criticalTooltipLowLevel', permissionsSection);
    this.mediumTooltip = this.translationService.getTranslation('criticalTooltipMediumLevel', permissionsSection);
    this.highTooltip = this.translationService.getTranslation('criticalTooltipHighLevel', permissionsSection);
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
      .catch(() => {});
  }
}
