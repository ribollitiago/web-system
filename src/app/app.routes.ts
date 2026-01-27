import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guard/auth.guard';
import { HomeComponent } from './pages/main/home/home.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DetailsUsersComponent } from './features/users/details-users/details-users.component';
import { RegisterComponent } from './features/register/register.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard], // ← SÓ rotas privadas abaixo
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'users', component: DetailsUsersComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];

