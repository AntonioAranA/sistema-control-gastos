import type { Response } from 'express';
import { AuthController } from '../src/auth/auth.controller';
import type { SessionResult } from '../src/auth/auth.service';
import type { AuthService } from '../src/auth/auth.service';

describe('AuthController session cookies', () => {
  const session = (rememberMe: boolean): SessionResult => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    csrfToken: 'csrf-token',
    rememberMe,
    user: { id: 'user-1', email: 'person@example.cl' }
  });

  it('usa cookies de sesión cuando no se solicita persistencia', () => {
    const cookie = jest.fn();
    const controller = new AuthController({} as AuthService);
    const respond = Reflect.get(controller, 'respond') as (
      result: SessionResult,
      response: Response
    ) => unknown;

    respond.call(controller, session(false), { cookie } as unknown as Response);

    expect(cookie).toHaveBeenCalledTimes(2);
    expect(cookie.mock.calls[0]?.[2]).not.toHaveProperty('maxAge');
    expect(cookie.mock.calls[1]?.[2]).not.toHaveProperty('maxAge');
  });

  it('asigna expiración persistente solo cuando se marca recordar sesión', () => {
    const cookie = jest.fn();
    const controller = new AuthController({} as AuthService);
    const respond = Reflect.get(controller, 'respond') as (
      result: SessionResult,
      response: Response
    ) => unknown;

    respond.call(controller, session(true), { cookie } as unknown as Response);

    expect(cookie).toHaveBeenCalledTimes(2);
    expect(cookie.mock.calls[0]?.[2]).toHaveProperty('maxAge');
    expect(cookie.mock.calls[1]?.[2]).toHaveProperty('maxAge');
  });
});
