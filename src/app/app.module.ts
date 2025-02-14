import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';

import { LoginComponent } from './pages/login/login.component';
import { AppComponent } from './app.component';
import { RegisterStep1Component } from './pages/main/register/register-step-1/register-step-1.component';
import { RegisterStep2Component } from './pages/main/register/register-step-2/register-step-2.component';
import { RegisterStep3Component } from './pages/main/register/register-step-3/register-step-3.component';
import { RegisterComponent } from './pages/main/register/register.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
     // Declara os componentes não-standalone
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
    ToastrModule.forRoot(),
    BrowserAnimationsModule,
    FormsModule,
    RouterModule,
    AppRoutingModule,
    LoginComponent,
    RegisterComponent,
    RegisterStep1Component,
    RegisterStep2Component,
    RegisterStep3Component,
    CommonModule,
    HttpClientModule
  ],

})
export class AppModule {}
