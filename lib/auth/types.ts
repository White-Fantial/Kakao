import type { AccountType, UserRole, UserStatus } from '@prisma/client';

export type SessionUser = {
  id: string;
  kakaoId: string;
  displayName: string;
  role: UserRole;
  accountType: AccountType;
  isManagedAccount: boolean;
  isActive: boolean;
  status: UserStatus;
  countryId: string | null;
  cityId: string | null;
};
