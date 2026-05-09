'use server';

import { UserRole, UserStatus } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSessionCookieName } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/**
 * TODO(Phase 1): Replace this placeholder with real Kakao OAuth callback handling.
 * Keep this boundary stable so the rest of the app can switch auth providers safely.
 */
export async function loginWithKakaoPlaceholder(formData: FormData) {
  const kakaoId = String(formData.get('kakaoId') || '').trim();
  const displayName = String(formData.get('displayName') || '').trim();
  const role = String(formData.get('role') || '').trim() as UserRole;

  if (!kakaoId || !displayName) {
    redirect('/login?error=missing');
  }

  const normalizedRole =
    role === 'COORDINATOR' || role === 'ADMIN' ? role : UserRole.USER;

  const user = await prisma.user.upsert({
    where: { kakaoId },
    update: {
      displayName,
      role: normalizedRole,
      status: UserStatus.ACTIVE,
    },
    create: {
      kakaoId,
      displayName,
      role: normalizedRole,
      status: UserStatus.ACTIVE,
    },
    select: { id: true },
  });

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect('/posts');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
  redirect('/posts');
}
