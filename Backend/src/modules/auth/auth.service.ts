import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

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
