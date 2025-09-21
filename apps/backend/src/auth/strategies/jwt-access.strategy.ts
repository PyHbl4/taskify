import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokensConfig } from '../../config/tokens.config';
import { Role } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../users/users.types';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<TokensConfig>('tokens').accessSecret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles as Role[],
    };
  }
}
