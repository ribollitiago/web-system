import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guard/auth.guard';
import { HomeComponent } from './pages/main/home/home.component'; // Add this
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { RegisterStep1Component } from './pages/main/register/register-step-1/register-step-1.component';
import { UsersComponent } from './pages/main/users/users.component';
import { RegisterStep2Component } from './pages/main/register/register-step-2/register-step-2.component';
import { RegistrationGuard } from './guard/register.guard';
import { RegisterStep3Component } from './pages/main/register/register-step-3/register-step-3.component';
import { RegistrationStep3Guard } from './guard/register-step-3.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      {
        path: 'register',
        children: [
          { path: '', component: RegisterStep1Component },
          {
            path: 'permissions',
            children: [
              {
                path: '',
                component: RegisterStep2Component,
                canActivate: [RegistrationGuard]
              },
              {
                path: 'resume',
                component: RegisterStep3Component,
                canActivate: [RegistrationStep3Guard]
              }
            ]
          }
        ]
      },
      { path: 'users', component: UsersComponent },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ]
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
