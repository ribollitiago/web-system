import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { RegisterService } from '../services/register.service';

@Injectable({ providedIn: 'root' })
export class RegistrationStep3Guard implements CanActivate {
  constructor(
    private regService: RegisterService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    // Check if Step 2 is completed
    if (this.regService.isStep2Completed()) {
      return true; // Allow access to Step 3
    }
    // Redirect to Step 2 if not completed
    return this.router.parseUrl('/register/permissions');
  }
}
