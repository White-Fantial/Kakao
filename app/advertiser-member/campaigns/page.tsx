import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  advertiserMemberNavItems,
  ManagementSectionNav,
} from '@/components/admin/management-section-nav';
import {
  AD_BILLING_STATUS_LABELS,
  AD_CAMPAIGN_STATUS_LABELS,
  AD_PLACEMENT_TYPE_LABELS,
} from '@/lib/ads/types';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { canAccessAdvertiserMemberSection } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

type AdvertiserMemberCampaignsPageProps = {
  searchParams: Promise<{ campaignId?: string }>;
};

export default async function AdvertiserMemberCampaignsPage({
  searchParams,
}: AdvertiserMemberCampaignsPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !(await canAccessAdvertiserMemberSection(currentUser))) {
    redirect('/posts');
  }

  const query = await searchParams;
  const memberships = await prisma.advertiserMember.findMany({
    where: { userId: currentUser.id, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      advertiserId: true,
    },
  });

  const advertiserIds = memberships.map((membership) => membership.advertiserId);
  const adCampaigns = advertiserIds.length
    ? await prisma.adCampaign.findMany({
        where: { advertiserId: { in: advertiserIds } },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          billingStatus: true,
          priority: true,
          startAt: true,
          endAt: true,
          maxImpressions: true,
          estimatedAmount: true,
          finalAmount: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
          adContentId: true,
          advertiser: { select: { name: true } },
          adProduct: { select: { code: true, name: true, placementType: true } },
          targetCountry: { select: { name: true } },
          targetCity: { select: { name: true } },
          adContent: { select: { title: true } },
          post: { select: { title: true } },
          _count: { select: { impressions: true, clicks: true } },
        },
      })
    : [];

  const selectedCampaign = query.campaignId
    ? adCampaigns.find((campaign) => campaign.id === query.campaignId)
    : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">광고주 멤버 — 캠페인 조회</h1>
        <ManagementSectionNav items={advertiserMemberNavItems} />
      </div>

      <div className="space-y-3">
        {adCampaigns.length === 0 ? (
          <p className="rounded-xl border border-[#e8e8e8] bg-white p-4 text-sm text-[#888]">
            멤버로 속한 광고주의 캠페인이 없습니다.
          </p>
        ) : (
          adCampaigns.map((campaign) => {
            const ctr =
              campaign._count.impressions > 0
                ? ((campaign._count.clicks / campaign._count.impressions) * 100).toFixed(2)
                : '0.00';
            const statusColor: Record<string, string> = {
              ACTIVE: 'text-green-700 bg-green-50',
              PAUSED: 'text-amber-700 bg-amber-50',
              DRAFT: 'text-gray-600 bg-gray-50',
              ENDED: 'text-gray-500 bg-gray-50',
              CANCELLED: 'text-red-600 bg-red-50',
            };

            return (
              <div
                key={campaign.id}
                className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[campaign.status] ?? 'bg-gray-50 text-gray-600'}`}
                      >
                        {AD_CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </span>
                      <p className="text-sm font-semibold">
                        {campaign.adContent?.title ??
                          campaign.post?.title ??
                          `(제목 없음) — ${campaign.id.slice(0, 8)}`}
                      </p>
                      <span className="text-xs text-[#888]">
                        [{campaign.adProduct.code}] {campaign.adProduct.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#888]">
                      광고주 {campaign.advertiser?.name ?? '-'} · 노출 유형{' '}
                      {AD_PLACEMENT_TYPE_LABELS[campaign.adProduct.placementType]} · 우선순위{' '}
                      {campaign.priority}
                    </p>
                    <p className="text-xs text-[#888]">
                      진행상태 {AD_CAMPAIGN_STATUS_LABELS[campaign.status]} · 과금 상태{' '}
                      {AD_BILLING_STATUS_LABELS[campaign.billingStatus]}
                    </p>
                    <p className="text-xs text-[#888]">
                      노출 {campaign._count.impressions.toLocaleString()}회 · 클릭{' '}
                      {campaign._count.clicks.toLocaleString()}회 · CTR {ctr}%
                    </p>
                  </div>
                  <Link
                    href={`/advertiser-member/campaigns?campaignId=${campaign.id}`}
                    className="text-xs underline"
                  >
                    상세 보기
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedCampaign ? (
        <div className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">캠페인 상세</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[#888]">광고주</dt>
              <dd className="mt-0.5 font-medium">{selectedCampaign.advertiser?.name ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">진행상태</dt>
              <dd className="mt-0.5 font-medium">
                {AD_CAMPAIGN_STATUS_LABELS[selectedCampaign.status]}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">과금 상태</dt>
              <dd className="mt-0.5 font-medium">
                {AD_BILLING_STATUS_LABELS[selectedCampaign.billingStatus]}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">우선순위</dt>
              <dd className="mt-0.5">{selectedCampaign.priority}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-[#888]">연결된 콘텐츠/글</dt>
              <dd className="mt-0.5">
                {selectedCampaign.adContent?.title ??
                  selectedCampaign.post?.title ??
                  '(연결된 콘텐츠/글 없음)'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">집행 기간</dt>
              <dd className="mt-0.5">
                {selectedCampaign.startAt
                  ? new Date(selectedCampaign.startAt).toLocaleDateString('ko-KR')
                  : '시작일 미정'}{' '}
                ~{' '}
                {selectedCampaign.endAt
                  ? new Date(selectedCampaign.endAt).toLocaleDateString('ko-KR')
                  : '종료일 미정'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">최대 노출수</dt>
              <dd className="mt-0.5">
                {selectedCampaign.maxImpressions != null
                  ? `${selectedCampaign.maxImpressions.toLocaleString()}회`
                  : '무제한'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">견적 금액</dt>
              <dd className="mt-0.5">
                {selectedCampaign.estimatedAmount != null
                  ? `NZD ${Number(selectedCampaign.estimatedAmount).toFixed(2)}`
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">확정 금액</dt>
              <dd className="mt-0.5">
                {selectedCampaign.finalAmount != null
                  ? `NZD ${Number(selectedCampaign.finalAmount).toFixed(2)}`
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">타겟 위치</dt>
              <dd className="mt-0.5">
                {selectedCampaign.targetCountry?.name ?? '전체'}
                {selectedCampaign.targetCity?.name
                  ? ` / ${selectedCampaign.targetCity.name}`
                  : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#888]">최종 수정일</dt>
              <dd className="mt-0.5">
                {new Date(selectedCampaign.updatedAt).toLocaleString('ko-KR')}
              </dd>
            </div>
            {selectedCampaign.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#888]">메모</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-[#666]">
                  {selectedCampaign.notes}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
