import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { AuthGuard } from './auth.guard';

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard], // Adiciona o AuthGuard como provider
})
export class AppRoutingModule {}
