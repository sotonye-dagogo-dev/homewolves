import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * @deprecated Use `RolesGuard` + `@Roles(...)` instead. This guard required
 * `user.hasPermission()` which the JWT plain-object user does not implement.
 * Kept only so existing imports do not break — new code must use `RolesGuard`.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>('permissions', context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as BaseUser | undefined;
    if (!user) return false;

    return requiredPermissions.every((perm) => user.hasPermission(perm));
  }
}
