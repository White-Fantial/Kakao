'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeReturnTo(value: FormDataEntryValue | null) {
  const returnTo = normalizeText(value);

  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return null;
  }

  return returnTo;
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const openChatUrl = normalizeText(formData.get('openChatUrl')) || null;
  const cityId = normalizeText(formData.get('cityId')) || null;
  const returnTo = normalizeReturnTo(formData.get('returnTo'));

  if (cityId) {
    const city = await prisma.city.findFirst({
      where: { id: cityId, isActive: true },
      select: { id: true },
    });

    if (!city) {
      redirect('/my/profile?error=유효한 지역을 선택해 주세요.');
    }
  }

  if (returnTo && !cityId) {
    redirect(
      `/my/profile?returnTo=${encodeURIComponent(returnTo)}&error=${encodeURIComponent('글을 쓰기 전에 지역을 먼저 설정해 주세요.')}`,
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { openChatUrl, cityId },
  });

  revalidatePath('/my/profile');
  redirect(returnTo ?? '/my/profile?success=1');
}
