import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import {
  coordinatorSectionNavItems,
  ManagementSectionHeader,
} from '@/components/admin/management-section-nav';
import { InfinitePostList } from '@/components/posts/infinite-post-list';
import { EmptyStateMessage } from '@/components/ui/empty-state-message';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { canAccessCoordinatorSection } from '@/lib/permissions';
import {
  fetchCoordinationPosts,
  normalizeCoordinationPeriod,
  normalizeCoordinationSort,
  normalizeCoordinationStatus,
} from '@/lib/coordination/post-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '코디네이션 — 게시글 목록',
};

type CoordinationPostsPageProps = {
  searchParams: Promise<{
    sort?: string | string[];
    status?: string | string[];
    period?: string | string[];
    category?: string | string[];
  }>;
};

function toSingle(value: string | string[] | undefined) {
  if (!value) {
    return '';
  }

  return (Array.isArray(value) ? value[0] : value).trim();
}

const SORT_LABELS: Record<string, string> = {
  latest: '최신순',
  popular_7d: '최근 7일 인기순',
  no_comments: '댓글 없는 순',
  most_reported_7d: '최근 7일 신고 많은 순',
  low_engagement_recent: '최신·저반응 순',
};

const STATUS_LABELS: Record<string, string> = {
  ALL: '전체 상태',
  PUBLISHED: '게시됨',
  HELD: '보류',
  DELETED: '삭제됨',
};

const PERIOD_LABELS: Record<string, string> = {
  ALL: '전체 기간',
  '7D': '최근 7일',
};

export default async function CoordinationPostsPage({ searchParams }: CoordinationPostsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessCoordinatorSection(currentUser)) {
    redirect('/posts');
  }

  const params = await searchParams;
  const sort = normalizeCoordinationSort(toSingle(params.sort));
  const status = normalizeCoordinationStatus(toSingle(params.status));
  const period = normalizeCoordinationPeriod(toSingle(params.period));
  const cityId = currentUser.cityId ?? null;

  if (!cityId) {
    return (
      <section className="space-y-6">
        <ManagementSectionHeader
          sectionLabel="코디네이션"
          pageLabel="게시글 목록"
          items={coordinatorSectionNavItems}
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          도시가 설정되어 있지 않아 게시글 목록을 조회할 수 없습니다. 프로필에서 기본 도시를 먼저 설정해 주세요.
        </div>
      </section>
    );
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { id: true, name: true },
  });

  const categoryOptions = await prisma.category.findMany({
    where: {
      isActive: true,
      visibilityMode: { in: ['NORMAL', 'ALWAYS_INCLUDED'] },
    },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  });
  const categoryIdSet = new Set(categoryOptions.map((category) => category.id));
  const requestedCategoryId = toSingle(params.category);
  const categoryId = categoryIdSet.has(requestedCategoryId) ? requestedCategoryId : null;

  const initialData = await fetchCoordinationPosts({
    cityId,
    sort,
    status,
    period,
    categoryId,
    offset: 0,
  });

  const filterParams = new URLSearchParams();
  filterParams.set('sort', sort);
  filterParams.set('status', status);
  filterParams.set('period', period);
  if (categoryId) {
    filterParams.set('category', categoryId);
  }

  return (
    <section className="space-y-6">
      <ManagementSectionHeader
        sectionLabel="코디네이션"
        pageLabel="게시글 목록"
        items={coordinatorSectionNavItems}
      />

      <div className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">{city?.name ?? '내 도시'} 게시글 운영 목록</h2>
        <p className="mt-1 text-sm text-[#888]">필터와 정렬로 응대가 필요한 글을 빠르게 찾을 수 있어요.</p>

        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-[#555]">정렬</span>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-sm focus:border-[#fee500] focus:outline-none"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-[#555]">상태</span>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-sm focus:border-[#fee500] focus:outline-none"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-[#555]">기간</span>
            <select
              name="period"
              defaultValue={period}
              className="w-full rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-sm focus:border-[#fee500] focus:outline-none"
            >
              {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-[#555]">카테고리</span>
            <select
              name="category"
              defaultValue={categoryId ?? ''}
              className="w-full rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-sm focus:border-[#fee500] focus:outline-none"
            >
              <option value="">전체 카테고리</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-xl bg-[#fee500] px-4 py-2 text-sm font-bold text-[#3c1e1e] hover:bg-[#f5db00]"
            >
              필터 적용
            </button>
          </div>
        </form>
      </div>

      {initialData.posts.length === 0 ? (
        <EmptyStateMessage
          title="조건에 맞는 게시글이 없어요."
          description="필터를 완화하거나 정렬 기준을 바꿔 다시 확인해 보세요."
        />
      ) : (
        <InfinitePostList
          initialPosts={initialData.posts}
          initialNextCursor={initialData.nextCursor}
          fetchApiUrl={`/api/coordination/posts?${filterParams.toString()}`}
          cardConfig={{
            mode: 'feed',
            showLikeAction: false,
            showSaveAction: false,
            returnTo: `/coordination/posts?${filterParams.toString()}`,
          }}
        />
      )}
    </section>
  );
}
