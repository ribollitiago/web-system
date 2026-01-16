import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guard/auth.guard';
import { HomeComponent } from './pages/main/home/home.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { RegisterStep1Component } from './features/register/register-step-1/register-step-1.component';
import { UsersComponent } from './features/users/users/users.component';
import { RegisterStep2Component } from './features/register/register-step-2/register-step-2.component';
import { RegisterStep3Component } from './features/register/register-step-3/register-step-3.component';
import { RegisterComponent } from './features/register/register.component';

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
      // app.routes.ts
      {
        path: 'register',
        component: RegisterComponent,
        canActivate: [AuthGuard], // Protege a rota de registro
      },
      { path: 'users', component: UsersComponent },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
