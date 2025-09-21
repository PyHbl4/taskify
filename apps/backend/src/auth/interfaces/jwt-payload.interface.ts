import { Role } from '../../common/decorators/roles.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  tokenId?: string;
}

export interface RefreshPayload extends JwtPayload {
  tokenId: string;
}
