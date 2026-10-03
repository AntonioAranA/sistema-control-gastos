import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }));

describe('AuthService', () => {
  it('no revela si el correo existe al fallar el login', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) }
    } as unknown as PrismaService;
    const service = new AuthService(prisma, new JwtService(), new ConfigService());
    await expect(service.login('nadie@correo.cl', 'incorrecta')).rejects.toMatchObject({
      message: 'Credenciales inválidas'
    });
  });

  it('solo permite una rotación concurrente del mismo refresh token', async () => {
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.mocked(argon2.hash).mockResolvedValue('hashed-new-token');
    let claimed = false;
    const session = {
      id: 'session-1',
      tokenHash: 'hashed-old-token',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', email: 'persona@correo.cl' }
    };
    const prisma = {
      refreshSession: {
        findUnique: jest.fn().mockResolvedValue(session),
        updateMany: jest.fn().mockImplementation(async () => {
          if (claimed) return { count: 0 };
          claimed = true;
          return { count: 1 };
        }),
        create: jest.fn().mockResolvedValue({ id: 'session-2' }),
        update: jest.fn().mockResolvedValue({})
      }
    } as unknown as PrismaService;
    const jwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ sub: 'user-1', sid: 'session-1', type: 'refresh' }),
      signAsync: jest.fn().mockResolvedValue('new-token')
    } as unknown as JwtService;
    const config = {
      get: jest.fn((key: string) =>
        key === 'JWT_REFRESH_SECRET'
          ? 'refresh-secret'
          : key === 'JWT_ACCESS_SECRET'
            ? 'access-secret'
            : undefined
      )
    } as unknown as ConfigService;
    const service = new AuthService(prisma, jwt, config);
    const results = await Promise.allSettled([
      service.refresh('old-token'),
      service.refresh('old-token')
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1);
    expect(prisma.refreshSession.updateMany).toHaveBeenCalledTimes(2);
  });

  it('incluye la preferencia de persistencia firmada en el refresh token', async () => {
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.mocked(argon2.hash).mockResolvedValue('hashed-refresh-token');
    const user = {
      id: 'user-1',
      email: 'persona@correo.cl',
      passwordHash: 'hashed-password'
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      refreshSession: {
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
        update: jest.fn().mockResolvedValue({})
      }
    } as unknown as PrismaService;
    const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') } as unknown as JwtService;
    const config = {
      get: jest.fn((key: string) =>
        key === 'JWT_REFRESH_SECRET'
          ? 'refresh-secret'
          : key === 'JWT_ACCESS_SECRET'
            ? 'access-secret'
            : undefined
      )
    } as unknown as ConfigService;

    const result = await new AuthService(prisma, jwt, config).login(
      user.email,
      'correct-password',
      true
    );

    expect(result.rememberMe).toBe(true);
    expect(jwt.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ rememberMe: true, type: 'refresh' }),
      expect.any(Object)
    );
  });
});
