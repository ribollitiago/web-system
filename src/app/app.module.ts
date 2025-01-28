import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire/compat';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';

import { LoginComponent } from './pages/login/login.component';
import { AppComponent } from './app.component';
import { MainComponent } from './pages/main/main.component';

@NgModule({
  declarations: [
     // Declara os componentes não-standalone
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    ToastrModule.forRoot(),
    BrowserAnimationsModule,
    FormsModule,
    RouterModule,
    AppRoutingModule,
    LoginComponent,
    MainComponent
  ],
  // bootstrap array removed as AppComponent is standalone
})
export class AppModule {}
