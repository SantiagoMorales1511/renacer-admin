import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY, AppPermission } from '../decorators/permissions.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<AppPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }

    if (requiredPermissions) {
      const hasAll = requiredPermissions.every((p) => user[p] === true);
      if (!hasAll) {
        throw new ForbiddenException('No tienes el permiso requerido');
      }
    }

    return true;
  }
}
