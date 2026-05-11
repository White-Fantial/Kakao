import type { PermissionEffect, PermissionResourceType, PostStatus, SaleStatus, UserRole, UserStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

type PermissionUser = {
  id: string;
  role: UserRole;
  status: UserStatus;
};

type PermissionPost = {
  id: string;
  authorId: string;
  status: PostStatus;
  saleStatus: SaleStatus | null;
};

type PermissionComment = {
  id: string;
  authorId: string;
};

type PermissionCategory = {
  id: string;
};

const ROLE_RANK: Record<UserRole, number> = { USER: 0, COORDINATOR: 1, ADMIN: 2 };

export { ROLE_RANK };

const DEFAULT_PERMISSION_EFFECT: Record<UserRole, Record<PermissionResourceType, PermissionEffect>> = {
  USER: {
    CATEGORY: 'ALLOW',
    COUNTRY: 'ALLOW',
    CITY: 'ALLOW',
  },
  COORDINATOR: {
    CATEGORY: 'ALLOW',
    COUNTRY: 'ALLOW',
    CITY: 'ALLOW',
  },
  ADMIN: {
    CATEGORY: 'ALLOW',
    COUNTRY: 'ALLOW',
    CITY: 'ALLOW',
  },
};

function resolveDefaultEffect(user: PermissionUser, resourceType: PermissionResourceType) {
  return DEFAULT_PERMISSION_EFFECT[user.role][resourceType];
}

async function resolveResourcePermission(
  user: PermissionUser,
  resourceType: PermissionResourceType,
  resourceId: string | null | undefined,
) {
  if (!resourceId) {
    return true;
  }

  const [userPolicy, rolePolicy] = await Promise.all([
    prisma.userWritePermissionPolicy.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId: user.id,
          resourceType,
          resourceId,
        },
      },
      select: { effect: true },
    }),
    prisma.roleWritePermissionPolicy.findUnique({
      where: {
        role_resourceType_resourceId: {
          role: user.role,
          resourceType,
          resourceId,
        },
      },
      select: { effect: true },
    }),
  ]);

  const effect = userPolicy?.effect ?? rolePolicy?.effect ?? resolveDefaultEffect(user, resourceType);
  return effect === 'ALLOW';
}

function isActiveWriter(user: PermissionUser | null | undefined) {
  return user?.status === 'ACTIVE';
}

export function canCreatePost(user: PermissionUser | null | undefined) {
  return isActiveWriter(user);
}

export async function canPostToCategory(
  user: PermissionUser | null | undefined,
  category: PermissionCategory,
) {
  if (!user) return false;
  return resolveResourcePermission(user, 'CATEGORY', category.id);
}

export async function canPostToCategoryAndCountry(
  user: PermissionUser | null | undefined,
  options: { categoryId: string; countryId: string | null | undefined },
) {
  if (!user) return false;

  const [canUseCategory, canUseCountry] = await Promise.all([
    resolveResourcePermission(user, 'CATEGORY', options.categoryId),
    resolveResourcePermission(user, 'COUNTRY', options.countryId),
  ]);

  return canUseCategory && canUseCountry;
}

export function canCreateComment(user: PermissionUser | null | undefined) {
  return isActiveWriter(user);
}

export function canReportPost(
  user: PermissionUser | null | undefined,
  post: PermissionPost,
) {
  if (!user || !isActiveWriter(user)) {
    return false;
  }

  if (post.status !== 'PUBLISHED') {
    return false;
  }

  return user.id !== post.authorId;
}

export function canEditPost(
  user: PermissionUser | null | undefined,
  post: PermissionPost,
) {
  if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
    return false;
  }

  if (user.role === 'ADMIN') {
    return true;
  }

  return user.id === post.authorId;
}

export function canDeletePost(
  user: PermissionUser | null | undefined,
  post: PermissionPost,
) {
  return canEditPost(user, post);
}

export function canDeleteComment(
  user: PermissionUser | null | undefined,
  comment: PermissionComment,
) {
  if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
    return false;
  }

  if (user.role === 'COORDINATOR' || user.role === 'ADMIN') {
    return true;
  }

  return user.id === comment.authorId;
}

export function canMarkPostAsSold(
  user: PermissionUser | null | undefined,
  post: PermissionPost,
) {
  if (!user) {
    return false;
  }

  return user.id === post.authorId && user.status === 'ACTIVE';
}

export function canMarkPostAsReserved(
  user: PermissionUser | null | undefined,
  post: PermissionPost,
) {
  return canMarkPostAsSold(user, post);
}

export function canMarkPostAsAvailable(
  user: PermissionUser | null | undefined,
  post: PermissionPost,
) {
  return canMarkPostAsSold(user, post);
}

export function canHoldPost(user: PermissionUser | null | undefined) {
  return user?.role === 'COORDINATOR' || user?.role === 'ADMIN';
}

export function canRestorePost(user: PermissionUser | null | undefined) {
  return canHoldPost(user);
}

export function canModerateUser(user: PermissionUser | null | undefined) {
  return canHoldPost(user);
}

export function canMakeFinalUserDecision(
  user: PermissionUser | null | undefined,
) {
  return user?.role === 'ADMIN';
}
