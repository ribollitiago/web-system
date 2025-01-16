import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire/compat';
import { ToastrModule } from 'ngx-toastr';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    ToastrModule.forRoot(),
    BrowserAnimationsModule
  ],
  providers: [],
})
export class AppModule {}
