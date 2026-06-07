import { RoleEntity, User } from '@/types/api';

export function getUserRoleSlug(user: User): string {
  if (typeof user.role === 'string') return user.role;
  return user.role.slug;
}

export function getUserRoleName(user: User): string {
  if (typeof user.role === 'object') return user.role.name;
  return user.role === 'admin' ? 'Administrador' : 'Cajero';
}

export function getUserRoleId(user: User): string {
  if (user.roleId) return user.roleId;
  if (typeof user.role === 'object') return user.role.id;
  return '';
}

export function isRoleEntity(value: User['role']): value is RoleEntity {
  return typeof value === 'object' && value !== null && 'slug' in value;
}
