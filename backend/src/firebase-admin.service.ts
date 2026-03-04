import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Database, getDatabase } from 'firebase-admin/database';

@Injectable()
export class FirebaseAdminService {
  private app?: App;
  private db?: Database;
  private auth?: Auth;

  constructor(private readonly configService: ConfigService) {}

  getDatabase(): Database {
    this.initializeIfNeeded();
    return this.db!;
  }

  getAuth(): Auth {
    this.initializeIfNeeded();
    return this.auth!;
  }

  async getList(path: string): Promise<Record<string, unknown>[]> {
    const snapshot = await this.getDatabase().ref(path).get();
    const value = snapshot.val();

    if (!value || typeof value !== 'object') {
      return [];
    }

    return Object.entries(value as Record<string, unknown>).map(([uid, item]) => ({
      uid,
      ...(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : { value: item }),
    }));
  }

  async getById(path: string): Promise<Record<string, unknown> | null> {
    const snapshot = await this.getDatabase().ref(path).get();

    if (!snapshot.exists()) {
      return null;
    }

    const value = snapshot.val();
    const uid = path.split('/').pop();

    if (typeof value === 'object' && value !== null) {
      return { uid, ...(value as Record<string, unknown>) };
    }

    return { uid, value };
  }

  async getByField(path: string, field: string, value: unknown): Promise<Record<string, unknown>[]> {
    const list = await this.getList(path);
    return list.filter((item) => item[field] === value);
  }

  async write(path: string, data: Record<string, unknown>, mode: 'set' | 'update' | 'push'): Promise<void> {
    const reference = this.getDatabase().ref(path);

    if (mode === 'set') {
      await reference.set(data);
      return;
    }

    if (mode === 'update') {
      await reference.update(data);
      return;
    }

    if (mode === 'push') {
      await reference.push(data);
      return;
    }

    throw new InternalServerErrorException('Unsupported write mode');
  }

  async delete(path: string): Promise<void> {
    await this.getDatabase().ref(path).remove();
  }

  private initializeIfNeeded(): void {
    if (this.app && this.db && this.auth) {
      return;
    }

    const projectId = this.requireEnv('FIREBASE_PROJECT_ID');
    const clientEmail = this.requireEnv('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
    const databaseURL = this.requireEnv('FIREBASE_DATABASE_URL');

    this.app =
      getApps().find((existingApp) => existingApp.name === 'backend-admin') ??
      initializeApp(
        {
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          databaseURL,
        },
        'backend-admin',
      );

    this.db = getDatabase(this.app);
    this.auth = getAuth(this.app);
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`Missing environment variable: ${key}`);
    }

    return value;
  }
}
