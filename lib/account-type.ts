import type { AccountType } from '@prisma/client';

type AccountTyped = {
  accountType: AccountType;
};

type ManagedAccountTyped = AccountTyped & {
  isManagedAccount: boolean;
  isActive: boolean;
};

export function isRealUserAccount(user: AccountTyped | null | undefined) {
  return user?.accountType === 'REAL_USER';
}

export function isPersonaAccount(user: AccountTyped | null | undefined) {
  return user?.accountType === 'PERSONA';
}

export function isOperatorAccount(user: AccountTyped | null | undefined) {
  return user?.accountType === 'OPERATOR';
}

export function isSystemAccount(user: AccountTyped | null | undefined) {
  return user?.accountType === 'SYSTEM';
}

export function canBeSelectedAsAuthorByAdmin(user: ManagedAccountTyped | null | undefined) {
  if (!user) {
    return false;
  }

  return (
    user.isManagedAccount &&
    user.isActive &&
    (user.accountType === 'PERSONA' || user.accountType === 'OPERATOR')
  );
}

export function shouldShowWarmth(user: AccountTyped | null | undefined) {
  if (!user) {
    return false;
  }

  return user.accountType === 'REAL_USER' || user.accountType === 'PERSONA';
}

export function shouldShowOperatorBadge(user: AccountTyped | null | undefined) {
  return user?.accountType === 'OPERATOR';
}

export function isCountedAsRealUser(user: AccountTyped | null | undefined) {
  return isRealUserAccount(user);
}
