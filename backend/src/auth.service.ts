import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAdminService } from './firebase-admin.service';

interface LoginResponse {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
}

interface LoginErrorResponse {
  error?: {
    message?: string;
  };
}

interface LoginFirebaseResponse {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
}

interface RegisterUserPayload {
  email: string;
  password: string;
  name?: string;
  date?: string;
  phone?: string;
  enrollment?: string;
  description?: string;
  permissions?: string[];
  groups?: string[];
  createdAt?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const apiKey = this.requireEnv('FIREBASE_WEB_API_KEY');

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = (await response.json()) as LoginErrorResponse;
      throw new UnauthorizedException(errorBody.error?.message ?? 'INVALID_CREDENTIALS');
    }

    const payload = (await response.json()) as LoginFirebaseResponse;

    return {
      uid: payload.localId,
      email: payload.email,
      idToken: payload.idToken,
      refreshToken: payload.refreshToken,
    };
  }

  async recoverPassword(email: string): Promise<void> {
    const apiKey = this.requireEnv('FIREBASE_WEB_API_KEY');

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = (await response.json()) as LoginErrorResponse;
      throw new UnauthorizedException(errorBody.error?.message ?? 'PASSWORD_RESET_FAILED');
    }
  }

  async registerUser(data: RegisterUserPayload): Promise<{ uid: string }> {
    const auth = this.firebaseAdminService.getAuth();
    const db = this.firebaseAdminService.getDatabase();

    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    const { password: _password, ...safeData } = data;

    await db.ref(`users/${userRecord.uid}`).set({
      ...safeData,
      email: data.email.toLowerCase(),
      uid: userRecord.uid,
      situation: 1,
    });

    return { uid: userRecord.uid };
  }

  async getUserProfile(uid: string): Promise<Record<string, unknown> | null> {
    return this.firebaseAdminService.getById(`users/${uid}`);
  }

  async logout(_token?: string): Promise<void> {
    return;
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`Missing environment variable: ${key}`);
    }

    return value;
  }
}
