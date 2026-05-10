'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { normalizeInternalPath } from '@/lib/posts/profile-city';

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeReturnTo(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return '/posts';
  }

  return normalizeInternalPath(value) ?? '/posts';
}

export async function saveSearchAlertAction(formData: FormData) {
  const user = await requireUser();
  const query = normalizeText(formData.get('query'));
  const returnTo = normalizeReturnTo(formData.get('returnTo'));
  const notifyOnKakao = formData.get('notifyOnKakao') === 'on';

  if (!query) {
    redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}error=${encodeURIComponent('저장할 검색어를 입력해 주세요.')}`);
  }

  await prisma.searchAlert.upsert({
    where: {
      userId_query: {
        userId: user.id,
        query,
      },
    },
    create: {
      userId: user.id,
      query,
      notifyOnKakao,
      isActive: true,
    },
    update: {
      notifyOnKakao,
      isActive: true,
    },
  });

  revalidatePath('/posts');
  redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}success=1`);
}

export async function updateSearchAlertAction(formData: FormData) {
  const user = await requireUser();
  const alertId = normalizeText(formData.get('alertId'));
  const returnTo = normalizeReturnTo(formData.get('returnTo'));
  const notifyOnKakao = formData.get('notifyOnKakao') === 'on';
  const isActive = formData.get('isActive') === 'on';

  if (!alertId) {
    redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}error=${encodeURIComponent('검색 조건을 찾을 수 없어요.')}`);
  }

  await prisma.searchAlert.updateMany({
    where: { id: alertId, userId: user.id },
    data: {
      notifyOnKakao,
      isActive,
    },
  });

  revalidatePath('/posts');
  redirect(returnTo);
}

export async function deleteSearchAlertAction(formData: FormData) {
  const user = await requireUser();
  const alertId = normalizeText(formData.get('alertId'));
  const returnTo = normalizeReturnTo(formData.get('returnTo'));

  if (!alertId) {
    redirect(returnTo);
  }

  await prisma.searchAlert.deleteMany({
    where: { id: alertId, userId: user.id },
  });

  revalidatePath('/posts');
  redirect(returnTo);
}
