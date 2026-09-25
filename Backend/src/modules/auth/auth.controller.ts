import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ADMIN_TOKEN_COOKIE_MAX_AGE_MS,
  ADMIN_TOKEN_COOKIE_NAME,
  getAdminTokenCookieOptions,
} from './auth.config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req.ip);

    res.cookie(ADMIN_TOKEN_COOKIE_NAME, result.accessToken, {
      ...getAdminTokenCookieOptions(),
      maxAge: ADMIN_TOKEN_COOKIE_MAX_AGE_MS,
    });

    return { admin: result.admin };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ADMIN_TOKEN_COOKIE_NAME, getAdminTokenCookieOptions());
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.me(req.user.userId);
  }
}
