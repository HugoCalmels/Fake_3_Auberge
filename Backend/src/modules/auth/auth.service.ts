import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginAttemptService } from './login-attempt.service';

const ALLOWED_ADMIN_ROLES = new Set(['owner', 'admin', 'manager']);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {}

  async login(dto: LoginDto, clientIp = 'unknown') {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const attemptKey = `${clientIp}:${normalizedEmail}`;

    this.loginAttemptService.ensureAllowed(attemptKey);

    const admin = await this.prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      this.loginAttemptService.recordFailure(attemptKey);
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );

    if (!isPasswordValid) {
      this.loginAttemptService.recordFailure(attemptKey);
      throw new UnauthorizedException('Identifiants invalides.');
    }

    if (!ALLOWED_ADMIN_ROLES.has(admin.role)) {
      this.loginAttemptService.recordFailure(attemptKey);
      throw new UnauthorizedException('Identifiants invalides.');
    }

    this.loginAttemptService.reset(attemptKey);

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async me(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin introuvable.');
    }

    return admin;
  }
}
