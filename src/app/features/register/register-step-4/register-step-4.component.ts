import { Component } from '@angular/core';
import { TranslationService } from '../../../core/services/translate.service';
import { RegisterService } from '../../../core/services/register.service';
import { Router } from '@angular/router';
import { DefaultStepComponent } from '../../../shared/layout/default-step/default-step.component';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PermissionsService } from '../../../core/services/permissions.service';
import { User } from '../../users/list-users/list-users.component';

@Component({
  selector: 'app-register-step-4',
  imports: [DefaultStepComponent, CommonModule, MatTooltipModule, MatMenuModule],
  templateUrl: './register-step-4.component.html',
  styleUrl: './register-step-4.component.scss'
})
export class RegisterStep4Component {
isLoading = false;
  registrationData: any = {};

  title: string = '';
  subtitle: string = '';
  stepOne: string = '';
  stepTwo: string = '';
  stepThree: string = '';
  btnRegister: string = '';

  titleName: string = '';
  titleEmail: string = '';
  titlePhone: string = '';
  titleEnrollment: string = '';

  attachment: string = '';
  btnAttachment: string = '';

  menuTooltip: string = '';
  zeroTooltip: string = '';
  lowTooltip: string = '';
  mediumTooltip: string = '';
  highTooltip: string = '';
  permissionUserSelected: any;

  constructor(
    private translationService: TranslationService,
    private registerService: RegisterService,
    private router: Router,
    private permissionsService: PermissionsService
  ) { }

  ngOnInit() {
    this.registrationData = this.registerService.getUserData();
    this.translationService.language$.subscribe(() => {
      this.loadTranslations();
    });
    this.loadTranslations();

    if (this.registrationData.permissions) {
      const ids = Object.keys(this.registrationData.permissions).filter(id => this.registrationData.permissions[id]);
      this.listPermissions(ids);
    }
  }

  loadTranslations() {
    const section = 'Resume_Page';
    this.title = this.translationService.getTranslation('title', section);
    this.subtitle = this.translationService.getTranslation('subtitle', section);
    this.btnRegister = this.translationService.getTranslation('btnRegister', section);

    const section2 = 'Register_Page';
    this.stepOne = this.translationService.getTranslation('stepOne', section2);
    this.stepTwo = this.translationService.getTranslation('stepTwo', section2);
    this.stepThree = this.translationService.getTranslation('stepThree', section2);

    this.titleName = this.translationService.getTranslation('titleName', section2);
    this.titleEmail = this.translationService.getTranslation('titleEmail', section2);
    this.titlePhone = this.translationService.getTranslation('titlePhone', section2);

    this.titleEnrollment = this.translationService.getTranslation('titleEnrollment', section2);

    const section3 = 'Extra_info_page';
    this.attachment = this.translationService.getTranslation('attachments', section3);
    this.btnAttachment = this.translationService.getTranslation('btnAttachment', section3);

    const sectio4 = 'Permissions_Page';
    this.menuTooltip = this.translationService.getTranslation('menuTooltip', sectio4);
    this.zeroTooltip = this.translationService.getTranslation('criticalTooltipZeroLevel', sectio4);
    this.lowTooltip = this.translationService.getTranslation('criticalTooltipLowLevel', sectio4);
    this.mediumTooltip = this.translationService.getTranslation('criticalTooltipMediumLevel', sectio4);
    this.highTooltip = this.translationService.getTranslation('criticalTooltipHighLevel', sectio4);

  }

  confirmRegistration() {
    this.registerService.registerUser().then(() => {
      this.router.navigate(['/home']);
    }).catch(error => {
    });
  }

  async return() {
    this.registerService.setCurrentStep(3);
  }

  private sortByCriticalLevel(permissions: any[]) {
    const levelOrder: { [key: string]: number } = {
      'HIGH_LEVEL': 0,
      'MEDIUM_LEVEL': 1,
      'LOW_LEVEL': 2,
      'ZERO_LEVEL': 3
    };

    permissions.sort((a, b) => {
      const aOrder = levelOrder[a.critical] ?? 3;
      const bOrder = levelOrder[b.critical] ?? 3;
      return aOrder - bOrder;
    });
  }

  async listPermissions(permissionIds: string[]) {
      const filtered = this.permissionsService.filterPermissionsByIds(
        await this.permissionsService.getPermissions(),
        permissionIds
      );

      const permissions: any[] = []; // Mudamos para array de objetos

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

  getSvgFileName(critical: string): string {
    const mapping: { [key: string]: string } = {
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
}
