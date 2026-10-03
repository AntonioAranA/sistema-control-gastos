import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookie = request.cookies as Record<string, string> | undefined;
    const header = request.header('X-CSRF-Token');
    if (!cookie?.csrf_token || !header || cookie.csrf_token !== header)
      throw new ForbiddenException('Token CSRF inválido');
    return true;
  }
}
