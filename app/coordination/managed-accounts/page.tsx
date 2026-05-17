import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import {
  coordinatorSectionNavItems,
  ManagementSectionHeader,
} from '@/components/admin/management-section-nav';
import { DateTimeText } from '@/components/ui/date-time-text';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { canAccessCoordinatorSection } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '코디네이션 — 운영 계정 조회',
};

export default async function CoordinationManagedAccountsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessCoordinatorSection(currentUser)) {
    redirect('/posts');
  }

  const cityId = currentUser.cityId ?? null;
  const countryId = currentUser.countryId ?? null;

  const managedAccounts = await prisma.user.findMany({
    where: {
      isManagedAccount: true,
      ...(cityId
        ? { cityId }
        : countryId
          ? { countryId }
          : { id: '__none__' }),
    },
    orderBy: [{ isActive: 'desc' }, { displayName: 'asc' }],
    select: {
      id: true,
      displayName: true,
      accountType: true,
      role: true,
      isActive: true,
      profileImageUrl: true,
      shortBio: true,
      personaNotes: true,
      toneNotes: true,
      activityNotes: true,
      countryId: true,
      country: { select: { name: true } },
      cityId: true,
      city: {
        select: {
          name: true,
          countryId: true,
          country: { select: { name: true } },
        },
      },
      createdAt: true,
    },
  });

  const regionLabel = cityId
    ? (managedAccounts[0]?.city?.name ?? '내 도시')
    : countryId
      ? (managedAccounts[0]?.country?.name ?? '내 국가')
      : null;

  return (
    <section className="space-y-6">
      <ManagementSectionHeader
        sectionLabel="코디네이션"
        pageLabel="운영 계정 조회"
        items={coordinatorSectionNavItems}
      />

      <div className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            운영 계정 목록
            {regionLabel ? (
              <span className="ml-2 text-sm font-normal text-[#888]">({regionLabel})</span>
            ) : null}
          </h2>
          {!cityId && !countryId ? (
            <p className="text-sm text-amber-700">
              프로필에 지역이 설정되어 있지 않아 운영 계정을 조회할 수 없습니다.
            </p>
          ) : null}
        </div>

        {managedAccounts.length === 0 ? (
          <p className="text-sm text-[#888]">해당 지역에 등록된 운영 계정이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {managedAccounts.map((account) => {
              const locationName =
                account.city?.name ??
                account.country?.name ??
                account.city?.country?.name ??
                null;

              return (
                <li key={account.id} className="rounded-xl border border-[#e8e8e8]">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-3 text-xs text-[#666] [&::-webkit-details-marker]:hidden">
                      <span className="font-semibold text-[#333] text-sm">{account.displayName}</span>
                      <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5">{account.accountType}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${account.isActive ? 'bg-green-50 text-green-700' : 'bg-[#f5f5f5] text-[#999]'}`}
                      >
                        {account.isActive ? '활성' : '비활성'}
                      </span>
                      {locationName ? (
                        <span className="rounded-full bg-[#fffde7] px-2 py-0.5 text-[#7a6000]">
                          {locationName}
                        </span>
                      ) : null}
                    </summary>

                    <div className="space-y-3 border-t border-[#f1f1f1] px-4 pb-4 pt-3 text-sm">
                      {account.shortBio ? (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-[#555]">소개</p>
                          <p className="whitespace-pre-wrap text-[#333]">{account.shortBio}</p>
                        </div>
                      ) : null}

                      {account.personaNotes ? (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-[#555]">페르소나 설정</p>
                          <p className="whitespace-pre-wrap rounded-lg bg-[#fffde7] p-3 text-xs text-[#3c1e1e]">
                            {account.personaNotes}
                          </p>
                        </div>
                      ) : null}

                      {account.toneNotes ? (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-[#555]">말투/톤 설정</p>
                          <p className="whitespace-pre-wrap rounded-lg bg-[#f0f8ff] p-3 text-xs text-[#1a3c5c]">
                            {account.toneNotes}
                          </p>
                        </div>
                      ) : null}

                      {account.activityNotes ? (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-[#555]">활동 가이드</p>
                          <p className="whitespace-pre-wrap rounded-lg bg-[#f5f5f5] p-3 text-xs text-[#444]">
                            {account.activityNotes}
                          </p>
                        </div>
                      ) : null}

                      {!account.shortBio && !account.personaNotes && !account.toneNotes && !account.activityNotes ? (
                        <p className="text-xs text-[#aaa]">설정된 성향 정보가 없습니다.</p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#aaa]">
                        <span>역할: {account.role}</span>
                        <span>생성: <DateTimeText value={account.createdAt} /></span>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
