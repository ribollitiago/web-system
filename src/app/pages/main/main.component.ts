import { Component } from '@angular/core';
import { LoginService } from '../../services/login.service'; // Importe o LoginService
import { Router } from '@angular/router'; // Importe o Router para redirecionar após o logout

@Component({
  selector: 'app-main',
  standalone: true, // Adicione standalone se estiver usando Angular 14+
  imports: [], // Adicione os módulos necessários aqui
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {

  constructor(
    private loginService: LoginService, // Injete o LoginService
    private router: Router // Injete o Router
  ) {}

  // Método para lidar com o logout
  logout() {
    this.loginService.logout().then(() => {
      console.log('Logout realizado com sucesso!');
      this.router.navigate(['/login']); // Redireciona para a página de login
    }).catch((err) => {
      console.error('Erro ao fazer logout:', err);
    });
  }
}
