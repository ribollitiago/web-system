import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';

import { LoginComponent } from './pages/login/login.component';
import { AppComponent } from './app.component';
import { RegisterStep1Component } from './features/register/register-step-1/register-step-1.component';
import { RegisterStep2Component } from './features/register/register-step-2/register-step-2.component';
import { RegisterStep3Component } from './features/register/register-step-3/register-step-3.component';
import { RegisterComponent } from './features/register/register.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import {MatTooltipModule} from '@angular/material/tooltip';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
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
    HttpClientModule,
    MatTooltipModule
  ],

})
export class AppModule {}
