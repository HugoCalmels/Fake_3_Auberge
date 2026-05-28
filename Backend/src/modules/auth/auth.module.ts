import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { getJwtExpiresIn, getJwtSecret } from './auth.config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LoginAttemptService } from './login-attempt.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LoginAttemptService],
  exports: [AuthService],
})
export class AuthModule {}
