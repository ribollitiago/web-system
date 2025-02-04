import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './pages/main/home/home.component'; // Add this
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { RegisterComponent } from './pages/main/register/register.component';
import { UsersComponent } from './pages/main/users/users.component';

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
      { path: 'register', component: RegisterComponent },
      { path: 'users', component: UsersComponent },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ]
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
