import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private userData: { [uid: string]: any } = {};
  private readonly SESSION_KEY = 'registration_data';

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private router: Router
  ) { }

  // Track registration progress in session storage
  setStep1Completed(data: any): void {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
      ...data,
      step1Completed: true
    }));
  }

  isStep1Completed(): boolean {
    const data = this.getRegistrationData();
    return !!data?.step1Completed;
  }

  setStep2Completed(data: any): void {
    const currentData = this.getRegistrationData();
    const newData = {
      ...currentData,
      ...data,
      step2Completed: true
    };
    // Remove step completion flags from stored data
    const { step1Completed, step2Completed, ...cleanData } = newData;
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
      ...cleanData,
      step1Completed: true,
      step2Completed: true
    }));
  }

  isStep2Completed(): boolean {
    const data = this.getRegistrationData();
    return !!data?.step2Completed; // Check if Step 2 is marked as completed
  }

  getCompleteRegistrationData(): any {
    const data = this.getRegistrationData();
    if (data) {
      // Remove all internal flags
      const { step1Completed, step2Completed, ...registrationData } = data;
      return registrationData;
    }
    return null;
  }

  getRegistrationData(): any {
    const data = sessionStorage.getItem(this.SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearRegistrationData(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  // Existing methods modified to work with session storage
  async setData(userData: any): Promise<void> {
    if (await this.isLoggedIn()) {
      const currentUser = await this.afAuth.currentUser;
      if (currentUser) {
        this.userData[currentUser.uid] = { ...userData };
      }
    } else {
      this.setStep1Completed(userData);
    }
  }

  async getData(): Promise<any> {
    if (await this.isLoggedIn()) {
      const currentUser = await this.afAuth.currentUser;
      return currentUser ? this.userData[currentUser.uid] : null;
    }
    return this.getRegistrationData();
  }

  async registerUser(): Promise<any> {
    try {
      const completeData = this.getCompleteRegistrationData();
      if (!completeData || !this.isStep2Completed()) {
        throw new Error('Complete all registration steps first');
      }

      const { email, password } = completeData;
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        const { password, ...userMap } = completeData;
        userMap.email = user.email;
        userMap.uid = user.uid;

        await this.db.database.ref('users/' + user.uid).set(userMap);
        this.clearRegistrationData();

        // Auto-login after registration
        await this.afAuth.signInWithEmailAndPassword(email, password);
        return user;
      }

      throw new Error('User not found after creation');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }



  private async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.afAuth.currentUser;
      return !!user;
    } catch (error) {
      return false;
    }
  }
}
