import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Entretenimiento',
  'Compras',
  'Sueldo',
  'Otros'
];
const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
interface RefreshPayload {
  sub: string;
  sid: string;
  type: 'refresh';
  rememberMe?: boolean;
}
export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  rememberMe: boolean;
  user: { id: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}
  async register(emailInput: string, password: string, rememberMe = false): Promise<SessionResult> {
    const email = emailInput.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } }))
      throw new ConflictException('El correo ya está registrado');
    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email, passwordHash } });
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((name) => ({
          userId: created.id,
          name,
          slug: slugify(name),
          isDefault: true
        }))
      });
      return created;
    });
    return this.createSession(user.id, user.email, rememberMe);
  }
  async login(emailInput: string, password: string, rememberMe = false): Promise<SessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: emailInput.trim().toLowerCase() }
    });
    if (!user || !(await argon2.verify(user.passwordHash, password)))
      throw new UnauthorizedException('Credenciales inválidas');
    return this.createSession(user.id, user.email, rememberMe);
  }
  async refresh(token: string): Promise<SessionResult> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(token, { secret: this.refreshSecret() });
    } catch {
      throw new UnauthorizedException('Sesión expirada');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Sesión inválida');
    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sid },
      include: { user: true }
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await argon2.verify(session.tokenHash, token))
    )
      throw new UnauthorizedException('Sesión expirada');
    const claimed = await this.prisma.refreshSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        tokenHash: session.tokenHash
      },
      data: { revokedAt: new Date() }
    });
    if (claimed.count !== 1) throw new UnauthorizedException('Sesión expirada');
    return this.createSession(session.user.id, session.user.email, payload.rememberMe ?? true);
  }
  async logout(token?: string): Promise<void> {
    if (!token) return;
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.refreshSecret(),
        ignoreExpiration: true
      });
      await this.prisma.refreshSession.updateMany({
        where: { id: payload.sid },
        data: { revokedAt: new Date() }
      });
    } catch {
      return;
    }
  }
  async clearData(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.movement.deleteMany({ where: { userId } }),
      this.prisma.budget.deleteMany({ where: { userId } }),
      this.prisma.savingsGoal.deleteMany({ where: { userId } }),
      this.prisma.category.deleteMany({ where: { userId, isDefault: false } })
    ]);
  }
  private async createSession(
    userId: string,
    email: string,
    rememberMe: boolean
  ): Promise<SessionResult> {
    const days = Number(this.config.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? 30);
    const expiresAt = new Date(Date.now() + days * 86_400_000);
    const session = await this.prisma.refreshSession.create({
      data: { userId, tokenHash: 'pending', expiresAt }
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, sid: session.id, type: 'refresh', rememberMe },
      { secret: this.refreshSecret(), expiresIn: `${days}d` }
    );
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { tokenHash: await argon2.hash(refreshToken) }
    });
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET es obligatorio');
    const expiresIn = (this.config.get<string>('ACCESS_TOKEN_TTL') ??
      '15m') as JwtSignOptions['expiresIn'];
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, sid: session.id, type: 'access' },
      { secret: accessSecret, expiresIn }
    );
    return {
      accessToken,
      refreshToken,
      csrfToken: randomBytes(24).toString('base64url'),
      rememberMe,
      user: { id: userId, email }
    };
  }
  private refreshSecret(): string {
    const value = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!value) throw new Error('JWT_REFRESH_SECRET es obligatorio');
    return value;
  }
}
