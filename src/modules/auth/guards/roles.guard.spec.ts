import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  const contextFor = (role?: UserRole) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { userId: 'u1', role } : undefined }),
      }),
    }) as unknown as ExecutionContext;

  const requireRoles = (roles?: UserRole[]) =>
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

  afterEach(() => jest.restoreAllMocks());

  it('libera rota sem @Roles para qualquer usuário autenticado', () => {
    requireRoles(undefined);
    expect(guard.canActivate(contextFor(UserRole.CUSTOMER))).toBe(true);
  });

  it('libera quando o papel do usuário está entre os exigidos', () => {
    requireRoles([UserRole.ADMIN, UserRole.ANALYST]);
    expect(guard.canActivate(contextFor(UserRole.ANALYST))).toBe(true);
  });

  it('nega com 403 quando o papel não está entre os exigidos', () => {
    requireRoles([UserRole.ADMIN]);
    expect(() => guard.canActivate(contextFor(UserRole.ANALYST))).toThrow(ForbiddenException);
  });

  it('nega com 403 quando não há usuário na requisição', () => {
    requireRoles([UserRole.ADMIN]);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });
});
