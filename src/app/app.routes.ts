import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './pages/home/home.component'; // Add this
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { RegisterComponent } from './pages/register/register.component';

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
      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ]
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
