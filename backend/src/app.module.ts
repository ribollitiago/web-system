import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseController } from './firebase.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, FirebaseController, AuthController],
  providers: [AppService, FirebaseAdminService, AuthService],
})
export class AppModule {}
