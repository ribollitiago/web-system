import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private fireauth: AngularFireAuth, private router: Router) { }

  login(email: string, password: string): Observable<any> {
    return from(this.fireauth.signInWithEmailAndPassword(email, password).then((userCredential) => {
      const user = userCredential.user;
      if (user) {

        sessionStorage.setItem('refresh-token', user.refreshToken);

        return { uid: user.uid };
      }
      throw new Error('User not found');
    }).catch((err) => {
      console.error('Login Error:', err);
      throw err;
    }));
  }

  isAuthenticated() {
    return this.fireauth.authState;
  }

  logout() {
    return this.fireauth.signOut().then(() => {
      sessionStorage.removeItem('auth-token');
      sessionStorage.removeItem('username');
      this.router.navigate(['/login']);
    }).catch((err) => {
      console.error('Logout Error:', err);
    });
  }

  recoverPassword(email: string) {
    return from(this.fireauth.sendPasswordResetEmail(email).then(() => {
      console.log('Password reset email sent successfully.');
    }).catch((err) => {
      console.error('Password reset Error:', err);
      throw err;
    }));
  }
}
