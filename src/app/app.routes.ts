import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './auth.guard';
import { MainComponent } from './pages/main/main.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home', // Redireciona para /home
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'home',
    component: MainComponent,
    canActivate: [AuthGuard], // Protege a rota
  },
  {
    path: '**', // Rota fallback (quando nenhuma outra corresponde)
    redirectTo: '/home',
  },
];
