import Image from 'next/image';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { canAccessAdsManagerSection } from '@/lib/permissions';

type AdContentPreviewPageProps = {
  params: Promise<{ adContentId: string }>;
};

async function getAdContent(adContentId: string) {
  try {
    return await prisma.adContent.findUnique({
      where: { id: adContentId },
      select: {
        id: true,
        advertiserId: true,
        status: true,
        title: true,
        body: true,
        thumbnailUrl: true,
        displayName: true,
        categoryName: true,
        cityName: true,
        advertiser: {
          select: { name: true },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function AdContentPreviewPage({ params }: AdContentPreviewPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/posts');
  }

  const { adContentId } = await params;
  const adContent = await getAdContent(adContentId);
  if (!adContent) {
    redirect('/posts');
  }

  const isAdManager = canAccessAdsManagerSection(currentUser);
  if (!isAdManager) {
    const membership = await prisma.advertiserMember.findFirst({
      where: {
        advertiserId: adContent.advertiserId,
        userId: currentUser.id,
        isActive: true,
      },
      select: { id: true },
    });
    if (!membership) {
      redirect('/posts');
    }
  }

  const advertiserName = adContent.displayName || adContent.advertiser.name;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-3 rounded-lg border border-[#e8e8e8] bg-[#f8f8f8] px-3 py-2 text-xs text-[#555]">
        광고 미리보기 · 현재 상태 {adContent.status}
      </div>
      <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
        {adContent.thumbnailUrl ? (
          <div className="relative h-52 w-full sm:h-64">
            <Image
              src={adContent.thumbnailUrl}
              alt={adContent.title?.trim() ? `광고: ${adContent.title.trim()}` : '광고 이미지'}
              fill
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              광고
            </span>
            {adContent.categoryName ? (
              <span className="inline-flex items-center rounded-full border border-[#f1e0a5] bg-[#fff7d1] px-2 py-0.5 text-xs font-medium text-[#7a6000]">
                {adContent.categoryName}
              </span>
            ) : null}
            {adContent.cityName ? (
              <span className="inline-flex items-center rounded-full border border-[#e8e8e8] bg-[#f7f7f7] px-2 py-0.5 text-xs text-[#555]">
                {adContent.cityName}
              </span>
            ) : null}
          </div>

          {adContent.title?.trim() ? (
            <h1 className="text-xl font-bold sm:text-2xl">{adContent.title.trim()}</h1>
          ) : null}

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#333] sm:text-base">
            {adContent.body}
          </p>

          <p className="text-sm text-[#888]">{advertiserName}</p>
        </div>
      </div>
    </main>
  );
}
