import { Body, Controller, Delete, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, type SessionResult } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CsrfGuard } from './csrf.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') @Throttle({ default: { limit: 5, ttl: 60_000 } }) async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.respond(
      await this.auth.register(dto.email, dto.password, dto.rememberMe ?? false),
      response
    );
  }
  @Post('login') @Throttle({ default: { limit: 5, ttl: 60_000 } }) async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.respond(
      await this.auth.login(dto.email, dto.password, dto.rememberMe ?? false),
      response
    );
  }
  @Post('refresh') @UseGuards(CsrfGuard) async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    return this.respond(await this.auth.refresh(cookies?.refresh_token ?? ''), response);
  }
  @Post('logout') @UseGuards(CsrfGuard) async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ success: true }> {
    const cookies = request.cookies as Record<string, string> | undefined;
    await this.auth.logout(cookies?.refresh_token);
    response.clearCookie('refresh_token', { path: '/api/auth' });
    response.clearCookie('csrf_token', { path: '/' });
    return { success: true };
  }
  @Get('me') @UseGuards(JwtAuthGuard) @ApiBearerAuth() me(@CurrentUser() user: AuthUser) {
    return { id: user.id, email: user.email };
  }
  @Delete('data') @HttpCode(204) @UseGuards(JwtAuthGuard) @ApiBearerAuth() clearData(
    @CurrentUser() user: AuthUser
  ) {
    return this.auth.clearData(user.id);
  }
  private respond(session: SessionResult, response: Response) {
    const secure = process.env.COOKIE_SECURE === 'true';
    response.cookie('refresh_token', session.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/api/auth',
      ...(session.rememberMe && {
        maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 86_400_000
      })
    });
    response.cookie('csrf_token', session.csrfToken, {
      httpOnly: false,
      secure,
      sameSite: 'strict',
      path: '/',
      ...(session.rememberMe && {
        maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 86_400_000
      })
    });
    return { accessToken: session.accessToken, user: session.user };
  }
}
