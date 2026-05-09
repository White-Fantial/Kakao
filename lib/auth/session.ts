import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import type { SessionUser } from '@/lib/auth/types';

const SESSION_COOKIE = 'kakao_user_id';

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      kakaoId: true,
      displayName: true,
      role: true,
      status: true,
    },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
