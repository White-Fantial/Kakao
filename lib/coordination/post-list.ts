import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { shouldShowOperatorBadge } from '@/lib/account-type';

const PAGE_SIZE = 20;
const BODY_PREVIEW_LENGTH = 220;
const PERIOD_7_DAYS = '7D';

export const COORDINATION_POST_SORT_OPTIONS = [
  'latest',
  'popular_7d',
  'no_comments',
  'most_reported_7d',
  'low_engagement_recent',
] as const;

export const COORDINATION_POST_STATUS_OPTIONS = [
  'ALL',
  'PUBLISHED',
  'HELD',
  'DELETED',
] as const;

export const COORDINATION_POST_PERIOD_OPTIONS = ['ALL', PERIOD_7_DAYS] as const;

export type CoordinationPostSort = (typeof COORDINATION_POST_SORT_OPTIONS)[number];
export type CoordinationPostStatus = (typeof COORDINATION_POST_STATUS_OPTIONS)[number];
export type CoordinationPostPeriod = (typeof COORDINATION_POST_PERIOD_OPTIONS)[number];

export type CoordinationPostItem = {
  id: string;
  title: string | null;
  bodyPreview: string;
  href: string;
  createdAt: string;
  isPinned: boolean;
  pinnedAt: string | null;
  price: string | null;
  thumbnailUrl: string | null;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  reportCount: number;
  category: { name: string; type: string; color: string | null };
  city: { name: string } | null;
  author: {
    displayName: string;
    profileImageUrl: string | null;
    isOperator: boolean;
  };
};

export function normalizeCoordinationSort(value: string | null | undefined): CoordinationPostSort {
  return COORDINATION_POST_SORT_OPTIONS.find((option) => option === value) ?? 'latest';
}

export function normalizeCoordinationStatus(value: string | null | undefined): CoordinationPostStatus {
  return COORDINATION_POST_STATUS_OPTIONS.find((option) => option === value) ?? 'PUBLISHED';
}

export function normalizeCoordinationPeriod(value: string | null | undefined): CoordinationPostPeriod {
  return COORDINATION_POST_PERIOD_OPTIONS.find((option) => option === value) ?? 'ALL';
}

export function normalizeOffsetCursor(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? '0', 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function resolveOrderBy(sort: CoordinationPostSort): Prisma.PostOrderByWithRelationInput[] {
  switch (sort) {
    case 'popular_7d':
      return [
        { communityScore: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ];
    case 'no_comments':
      return [
        { comments: { _count: 'asc' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ];
    case 'most_reported_7d':
      return [
        { reports: { _count: 'desc' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ];
    case 'low_engagement_recent':
      return [
        { createdAt: 'desc' },
        { communityScore: 'asc' },
        { viewCount: 'asc' },
        { id: 'desc' },
      ];
    case 'latest':
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

type FetchCoordinationPostsArgs = {
  cityId: string;
  sort: CoordinationPostSort;
  status: CoordinationPostStatus;
  period: CoordinationPostPeriod;
  categoryId: string | null;
  offset: number;
};

export async function fetchCoordinationPosts({
  cityId,
  sort,
  status,
  period,
  categoryId,
  offset,
}: FetchCoordinationPostsArgs): Promise<{ posts: CoordinationPostItem[]; nextCursor: string | null; pageSize: number }> {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const effectivePeriod =
    sort === 'popular_7d' || sort === 'most_reported_7d' || sort === 'low_engagement_recent'
      ? PERIOD_7_DAYS
      : period;

  const andConditions: Prisma.PostWhereInput[] = [{ cityId }];
  if (status !== 'ALL') {
    andConditions.push({ status });
  }
  if (categoryId) {
    andConditions.push({ categoryId });
  }
  if (effectivePeriod === PERIOD_7_DAYS) {
    andConditions.push({ createdAt: { gte: sevenDaysAgo } });
  }

  const where: Prisma.PostWhereInput = {
    AND: andConditions,
  };

  const posts = await prisma.post.findMany({
    where,
    orderBy: resolveOrderBy(sort),
    skip: offset,
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      viewCount: true,
      isPinned: true,
      pinnedAt: true,
      price: true,
      category: { select: { name: true, type: true, color: true } },
      city: { select: { name: true } },
      author: {
        select: {
          displayName: true,
          profileImageUrl: true,
          neighbourWarmth: true,
          accountType: true,
        },
      },
      images: {
        select: { url: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
      _count: {
        select: {
          comments: { where: { status: 'PUBLISHED' } },
          postLikes: true,
          reports: true,
        },
      },
    },
  });

  const hasExtra = posts.length > PAGE_SIZE;
  const visiblePosts = hasExtra ? posts.slice(0, PAGE_SIZE) : posts;
  const nextCursor = hasExtra ? String(offset + PAGE_SIZE) : null;

  return {
    posts: visiblePosts.map((post) => ({
      id: post.id,
      title: post.title,
      bodyPreview: post.body.slice(0, BODY_PREVIEW_LENGTH),
      href: `/posts/${post.id}`,
      createdAt: post.createdAt.toISOString(),
      isPinned: post.isPinned,
      pinnedAt: post.pinnedAt?.toISOString() ?? null,
      price: post.price ? post.price.toString() : null,
      thumbnailUrl: post.images[0]?.url ?? null,
      commentCount: post._count.comments,
      likeCount: post._count.postLikes,
      viewCount: post.viewCount,
      reportCount: post._count.reports,
      category: post.category,
      city: post.city,
      author: {
        displayName: post.author.displayName,
        profileImageUrl: post.author.profileImageUrl,
        isOperator: shouldShowOperatorBadge(post.author),
      },
    })),
    nextCursor,
    pageSize: PAGE_SIZE,
  };
}
