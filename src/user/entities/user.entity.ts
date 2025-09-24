import { Role } from '../../common/enums/role.enum';

export class User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
