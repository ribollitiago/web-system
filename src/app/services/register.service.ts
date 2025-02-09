import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private userData: { [uid: string]: any } = {};

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase
  ) { }

  private async getCurrentUser(): Promise<any> {
    try {
      const currentUser = await this.afAuth.currentUser;
      if (!currentUser) {
        throw new Error('Nenhum usuário logado');
      }
      return currentUser;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      throw error;
    }
  }

  async setData(userData: any): Promise<void> {
    const currentUser = await this.getCurrentUser();
    this.userData[currentUser.uid] = { ...userData };
  }

  async getData(): Promise<any> {
    const currentUser = await this.getCurrentUser();
    return this.userData[currentUser.uid];
  }

  async registerUser(): Promise<any> {
    try {
      const currentUser = await this.getCurrentUser();
      const userData = this.userData[currentUser.uid];

      const { email, password } = userData;

      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        const { password, ...userMap } = userData;
        userMap.email = user.email;

        await this.db.database.ref('users/' + user.uid).set(userMap);

        delete this.userData[currentUser.uid];

        return user;
      } else {
        throw new Error('Usuário não encontrado após criação.');
      }
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  }
}
