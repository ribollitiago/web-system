import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { RegisterService } from '../services/register.service';

@Injectable({ providedIn: 'root' })
export class RegistrationGuard implements CanActivate {
  constructor(
    private regService: RegisterService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    return this.regService.isStep1Completed()
      ? true
      : this.router.parseUrl('/register'); // Redirect if step 1 isn't done
  }
}
