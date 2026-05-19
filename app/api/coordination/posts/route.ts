import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/session';
import { canAccessCoordinatorSection } from '@/lib/permissions';
import {
  fetchCoordinationPosts,
  normalizeCoordinationPeriod,
  normalizeCoordinationSort,
  normalizeCoordinationStatus,
  normalizeOffsetCursor,
} from '@/lib/coordination/post-list';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canAccessCoordinatorSection(currentUser)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cityId = currentUser.cityId ?? null;
  if (!cityId) {
    return NextResponse.json({ posts: [], nextCursor: null, hasNextPage: false });
  }

  const { searchParams } = request.nextUrl;
  const sort = normalizeCoordinationSort(searchParams.get('sort'));
  const status = normalizeCoordinationStatus(searchParams.get('status'));
  const period = normalizeCoordinationPeriod(searchParams.get('period'));
  const offset = normalizeOffsetCursor(searchParams.get('cursor'));
  const categoryId = searchParams.get('category');

  const validatedCategoryId =
    categoryId &&
    (await prisma.category.count({
      where: {
        id: categoryId,
        isActive: true,
        visibilityMode: { in: ['NORMAL', 'ALWAYS_INCLUDED'] },
      },
    })) > 0
      ? categoryId
      : null;

  const result = await fetchCoordinationPosts({
    cityId,
    sort,
    status,
    period,
    categoryId: validatedCategoryId,
    offset,
  });

  return NextResponse.json({
    posts: result.posts,
    nextCursor: result.nextCursor,
    hasNextPage: Boolean(result.nextCursor),
  });
}
