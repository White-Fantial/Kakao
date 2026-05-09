import type { UserRole, UserStatus } from '@prisma/client';

export type SessionUser = {
  id: string;
  kakaoId: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
};
