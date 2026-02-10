import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guard/auth.guard';
import { HomeComponent } from './pages/main/home/home.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DetailsUsersComponent } from './features/users/details-users/details-users.component';
import { RegisterComponent } from './features/register/register.component';
import { NoAuthGuard } from './core/guard/no-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'users', component: DetailsUsersComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];


