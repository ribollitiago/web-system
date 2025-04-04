import { Injectable } from '@angular/core';
import { getAuth, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import firebaseApp from '../firebase.config';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service'; // Assumindo que você tem o FirebaseService

interface UserData {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private userData: Partial<UserData> = {};
  private currentStepSubject = new BehaviorSubject<number>(1);
  currentStep$ = this.currentStepSubject.asObservable();

  get currentStep(): number {
    return this.currentStepSubject.value;
  }

  setCurrentStep(step: number): void {
    this.currentStepSubject.next(step);
  }

  getUserData() {
    return this.userData
  }

  private auth = getAuth(firebaseApp);
  private db = getDatabase(firebaseApp);
  private firebaseService: FirebaseService;

  constructor(firebaseService: FirebaseService) {
    this.firebaseService = firebaseService;
  }

  // ------------------------------------------------------
  // SEÇÃO: ARMAZENAMENTO DE DADOS DE CADA ETAPA
  // ------------------------------------------------------

  async setStepData(step: number, data: UserData): Promise<void> {
    try {
      if (step < 1 || step > 4) {
        throw new Error('Etapa inválida');
      }

      this.userData = { ...this.userData, ...data };
      console.log(step, data)

      if (step < 4) {
        this.setCurrentStep(step + 1);
      }
    } catch (error) {
      console.error('Erro ao armazenar dados na etapa:', error);
      throw error;
    }
  }

  // ------------------------------------------------------
  // SEÇÃO: REGISTRO FINAL DO USUÁRIO
  // ------------------------------------------------------

  async registerUser(): Promise<User> {
    console.log('Dados antes do registro:', this.userData);
    try {
      if (!this.userData['email'] || !this.userData['password'] || !this.userData['cpf']) {
        throw new Error('Dados de usuário incompletos');
      }

      const existingUserByCpf = await this.firebaseService.getEntityByField('users','cpf', this.userData['cpf']);
      if (existingUserByCpf.length > 0) {
        throw new Error('Este CPF já está registrado.');
      }

      const existingUserByEmail = await this.firebaseService.getEntityByField('users', 'email', this.userData['email']);
      if (existingUserByEmail.length > 0) {
        throw new Error('Este email já está registrado.');
      }

      this.userData['id'] = await this.getMaxUserId();

      const userCredential = await createUserWithEmailAndPassword(this.auth, this.userData['email'], this.userData['password']);
      const user = userCredential.user;

      if (user) {
        const { password, ...userMap } = this.userData;

        await set(ref(this.db, 'users/' + user.uid), userMap);

        this.userData = {};
        this.setCurrentStep(1)

        return user;
      } else {
        throw new Error('Erro ao criar o usuário no Firebase.');
      }
    } catch (error) {
      console.error('Erro ao registrar o usuário:', error);
      throw error;
    }
  }

  private async getMaxUserId(): Promise<string> {
    try {
      const allUsers = await this.firebaseService.getAllEntity('users');

      const allUserIds = allUsers.map(user => user['id']);

      const maxId = Math.max(...allUserIds.map(id => parseInt(id, 10)));
      const finalId = maxId + 1;

      return finalId.toString().padStart(5, '0');
    } catch (error) {
      console.error('Erro ao buscar o maior ID de usuário:', error);
      return '00000';
    }
  }
}
