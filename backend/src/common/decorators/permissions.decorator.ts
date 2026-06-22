import { SetMetadata } from '@nestjs/common';

export type AppPermission = 'canRegisterExpenses' | 'canViewOtherDays';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
