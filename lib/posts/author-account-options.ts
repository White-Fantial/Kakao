import type { AccountType, UserRole, UserStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export type AuthorAccountKind = 'PERSONA' | 'OPERATOR';

export type AuthorAccountOption = {
  id: string;
  displayName: string;
  accountType: AuthorAccountKind;
  countryId: string | null;
  cityId: string | null;
};

export type AuthorScope = {
  countryId: string | null;
  cityId: string | null;
};

export type AuthorSelectionCandidate = {
  id: string;
  role: UserRole;
  accountType: AccountType;
  isManagedAccount: boolean;
  isActive: boolean;
  status: UserStatus;
  countryId: string | null;
  cityId: string | null;
  city: {
    countryId: string | null;
  } | null;
};

function resolveAuthorCountryId(candidate: AuthorSelectionCandidate) {
  return candidate.countryId ?? candidate.city?.countryId ?? null;
}

function toAuthorAccountKind(candidate: AuthorSelectionCandidate): AuthorAccountKind | null {
  if (!candidate.isManagedAccount || !candidate.isActive || candidate.status !== 'ACTIVE') {
    return null;
  }

  if (candidate.accountType === 'OPERATOR') {
    return 'OPERATOR';
  }

  if (candidate.accountType === 'PERSONA') {
    return 'PERSONA';
  }

  return null;
}

export function canSelectAuthorAccount(role: UserRole) {
  return role === 'ADMIN';
}

export function canActorUseAuthorForScope(
  actorRole: UserRole,
  candidate: AuthorSelectionCandidate,
  _scope: AuthorScope,
) {
  void _scope;
  const authorAccountKind = toAuthorAccountKind(candidate);
  if (!authorAccountKind) {
    return false;
  }

  if (actorRole === 'ADMIN') {
    return true;
  }

  return false;
}

export async function getAuthorAccountOptionsForActor(
  actorRole: UserRole,
  _allowedScopes: AuthorScope[],
): Promise<AuthorAccountOption[]> {
  void _allowedScopes;
  if (!canSelectAuthorAccount(actorRole)) {
    return [];
  }

  const authorAccountOptionsRaw = await prisma.user.findMany({
    where: {
      accountType: { in: ['PERSONA', 'OPERATOR'] },
      isManagedAccount: true,
      isActive: true,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      displayName: true,
      role: true,
      accountType: true,
      isManagedAccount: true,
      isActive: true,
      status: true,
      countryId: true,
      cityId: true,
      city: {
        select: {
          countryId: true,
        },
      },
    },
    orderBy: [{ displayName: 'asc' }],
  });

  return authorAccountOptionsRaw
    .map((candidate) => {
      const accountType = toAuthorAccountKind(candidate);
      if (!accountType) {
        return null;
      }

      const countryId = resolveAuthorCountryId(candidate);
      return {
        id: candidate.id,
        displayName: candidate.displayName,
        accountType,
        countryId,
        cityId: candidate.cityId,
      } satisfies AuthorAccountOption;
    })
    .filter((candidate): candidate is AuthorAccountOption => candidate !== null);
}
