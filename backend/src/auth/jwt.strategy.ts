import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '../common/auth-user';

interface JwtPayload {
  sub: string;
  email: string;
  sid: string;
  type: 'access';
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('JWT_ACCESS_SECRET es obligatorio');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret
    });
  }
  validate(payload: JwtPayload): AuthUser {
    if (payload.type !== 'access') throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email, sessionId: payload.sid };
  }
}
