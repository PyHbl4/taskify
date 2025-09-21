import { Role } from '../common/decorators/roles.decorator';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
}
