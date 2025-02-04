import { Component, input } from '@angular/core';
import { LoginService } from '../../../services/login.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Add this import

@Component({
  selector: 'app-home',
  standalone: true, // Add this line
  imports: [CommonModule], // Add CommonModule
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  logout() {
    this.loginService.logout().then(() => {
      console.log('Logout realizado com sucesso!');
      this.router.navigate(['/login']);
    }).catch((err) => {
      console.error('Erro ao fazer logout:', err);
    });
  }

}
