import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { AuthController } from './controllers/auth.controller.js'
import { AuthService } from './services/auth.service.js'

// Compose auth forwarding and JWT helpers; only AuthService is exported.
// JwtStrategy and the auth/session/role guards are not registered or applied.
@Module({
  imports: [
    PassportModule,
    HttpModule,
    // The factory receives ConfigService from DI after configuration loads.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          // Signing default only: login forwards tokens from the users service.
          expiresIn: '24h',
        },
      }),
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
