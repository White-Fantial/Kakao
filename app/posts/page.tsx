import Link from 'next/link';
import type { Metadata } from 'next';

import { PostCard } from '@/components/posts/post-card';
import {
  deleteSearchAlertAction,
  saveSearchAlertAction,
  updateSearchAlertAction,
} from '@/app/posts/search-alert-actions';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getActiveCategories, getActiveCities } from '@/lib/posts/reference-data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: '홈',
  description: '뉴질랜드 한인 커뮤니티의 최신 게시글을 확인해 보세요.',
};

type PostsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    city?: string | string[];
    q?: string | string[];
    success?: string;
    error?: string;
  }>;
};

function toArray(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function toSingle(value: string | string[] | undefined) {
  if (!value) {
    return '';
  }

  return (Array.isArray(value) ? value[0] : value).trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trimEnd()}…`;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  const keyword = toSingle(params.q);

  const [categories, cities, dbUser, searchAlerts] = await Promise.all([
    getActiveCategories(),
    getActiveCities(),
    currentUser
      ? prisma.user.findUnique({
          where: { id: currentUser.id },
          select: { cityId: true },
        })
      : Promise.resolve(null),
    currentUser
      ? prisma.searchAlert.findMany({
          where: { userId: currentUser.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            query: true,
            notifyOnKakao: true,
            isActive: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const alwaysIncludedCategories = categories.filter((category) => category.isAlwaysIncluded);
  const filterCategories = categories.filter((category) => !category.isAlwaysIncluded);
  const filterCategoryIds = new Set(filterCategories.map((category) => category.id));
  const cityIds = new Set(cities.map((city) => city.id));
  const profileCityId = dbUser?.cityId;
  const selectedFilterCategoryIdsFromParams = Array.from(
    new Set(toArray(params.category).filter((id) => filterCategoryIds.has(id))),
  );
  const selectedFilterCategoryIds =
    selectedFilterCategoryIdsFromParams.length > 0
      ? selectedFilterCategoryIdsFromParams
      : filterCategories.map((category) => category.id);
  const selectedCategoryIds = Array.from(
    new Set([
      ...selectedFilterCategoryIds,
      ...alwaysIncludedCategories.map((category) => category.id),
    ]),
  );
  const selectedCityIdsFromParams = Array.from(
    new Set(toArray(params.city).filter((id) => cityIds.has(id))),
  );
  const selectedCityIdsBase =
    selectedCityIdsFromParams.length > 0
      ? selectedCityIdsFromParams
      : cities.map((city) => city.id);
  const selectedCityIds =
    profileCityId &&
    cityIds.has(profileCityId) &&
    !selectedCityIdsBase.includes(profileCityId)
      ? [...selectedCityIdsBase, profileCityId]
      : selectedCityIdsBase;

  const shouldFilterByCategory =
    selectedFilterCategoryIds.length !== filterCategories.length;
  const shouldFilterByCity = selectedCityIds.length !== cities.length;
  const hasKeyword = Boolean(keyword);

  const returnToParams = new URLSearchParams();
  for (const categoryId of selectedFilterCategoryIdsFromParams) {
    returnToParams.append('category', categoryId);
  }
  for (const cityId of selectedCityIdsFromParams) {
    returnToParams.append('city', cityId);
  }
  if (keyword) {
    returnToParams.set('q', keyword);
  }
  const returnTo = `/posts${returnToParams.toString() ? `?${returnToParams.toString()}` : ''}`;

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      categoryId: shouldFilterByCategory ? { in: selectedCategoryIds } : undefined,
      ...(shouldFilterByCity
        ? { OR: [{ cityId: { in: selectedCityIds } }, { cityId: null }] }
        : {}),
      ...(hasKeyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { body: { contains: keyword, mode: 'insensitive' } },
              { author: { displayName: { contains: keyword, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      saleStatus: true,
      price: true,
      category: { select: { name: true } },
      city: { select: { name: true } },
      author: {
        select: {
          displayName: true,
          profileImageUrl: true,
        },
      },
      images: {
        select: { url: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
      _count: {
        select: {
          comments: {
            where: { status: 'PUBLISHED' },
          },
        },
      },
    },
  });

  const hasFilters = shouldFilterByCategory || shouldFilterByCity || hasKeyword;

  return (
    <section className="space-y-4">
      {params.success ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          검색 조건이 저장되었어요.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      ) : null}
      <form>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={keyword}
            placeholder="제목, 내용, 닉네임으로 검색"
            className="w-full rounded-xl border border-[#e8e8e8] px-3 py-2 text-sm focus:border-[#fee500] focus:outline-none focus:ring-2 focus:ring-[#fee500]/40"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#fee500] px-4 py-2 text-sm font-bold text-[#3c1e1e] hover:bg-[#f5db00]"
          >
            검색
          </button>
        </div>
        <details className="group rounded-xl border border-[#e8e8e8] bg-white p-3 shadow-sm">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
            <span>필터</span>
            <span className="group-open:hidden text-[#888]">펼치기</span>
            <span className="hidden group-open:inline text-[#888]">접기</span>
          </summary>

          <div className="mt-3 hidden grid-cols-1 gap-4 group-open:grid sm:grid-cols-2">
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium">카테고리 선택</legend>
              <div className="flex flex-wrap gap-2">
                {filterCategories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-[#e8e8e8] px-3 py-1.5 hover:border-[#fee500] hover:bg-[#fffde7]"
                  >
                    <input
                      type="checkbox"
                      name="category"
                      value={category.id}
                      defaultChecked={selectedFilterCategoryIds.includes(category.id)}
                      className="accent-[#fee500]"
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium">지역 선택</legend>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => {
                  const isProfileCity = city.id === profileCityId;

                  return (
                    <label
                      key={city.id}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-[#e8e8e8] px-3 py-1.5 hover:border-[#fee500] hover:bg-[#fffde7]"
                    >
                      <input
                        type="checkbox"
                        name="city"
                        value={city.id}
                        defaultChecked={selectedCityIds.includes(city.id)}
                        disabled={isProfileCity}
                        aria-label={
                          isProfileCity
                            ? `${city.name} (프로필 기본 지역으로 항상 선택됨)`
                            : city.name
                        }
                        className="accent-[#fee500]"
                      />
                      <span>{city.name}</span>
                      {isProfileCity ? (
                        <span className="text-xs text-[#888]">(기본 지역)</span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-[#fee500] px-4 py-2 text-sm font-bold text-[#3c1e1e] hover:bg-[#f5db00]"
              >
                필터 적용
              </button>
              <Link href="/posts" className="rounded-xl border border-[#e8e8e8] px-4 py-2 text-sm hover:bg-[#f9f9f9]">
                초기화
              </Link>
            </div>
          </div>
        </details>
      </form>

      {currentUser ? (
        <section className="space-y-3 rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">검색 조건 저장</h2>
          <form action={saveSearchAlertAction} className="space-y-2">
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="query" value={keyword} />
            <p className="text-xs text-[#777]">
              현재 검색어를 저장하고 조건에 맞는 글이 올라오면 카카오톡 알림을 받을 수 있어요.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notifyOnKakao" className="accent-[#fee500]" />
              카카오톡 알림 받기
            </label>
            <button
              type="submit"
              disabled={!keyword}
              className="rounded-xl border border-[#e8e8e8] px-3 py-2 text-sm font-medium hover:bg-[#f9f9f9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              현재 검색 조건 저장
            </button>
          </form>

          {searchAlerts.length > 0 ? (
            <ul className="space-y-2 border-t border-[#f0f0f0] pt-3">
              {searchAlerts.map((alert) => (
                <li key={alert.id} className="rounded-lg border border-[#efefef] p-3">
                  <p className="mb-2 text-sm font-medium">
                    &quot;{truncateText(alert.query, 40)}&quot;
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <form action={updateSearchAlertAction} className="flex items-center gap-2">
                      <input type="hidden" name="alertId" value={alert.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <label className="flex items-center gap-1 text-xs text-[#555]">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={alert.isActive}
                          className="accent-[#fee500]"
                        />
                        사용
                      </label>
                      <label className="flex items-center gap-1 text-xs text-[#555]">
                        <input
                          type="checkbox"
                          name="notifyOnKakao"
                          defaultChecked={alert.notifyOnKakao}
                          className="accent-[#fee500]"
                        />
                        카카오 알림
                      </label>
                      <button type="submit" className="rounded-md border border-[#e8e8e8] px-2 py-1 text-xs hover:bg-[#f9f9f9]">
                        저장
                      </button>
                    </form>
                    <form action={deleteSearchAlertAction}>
                      <input type="hidden" name="alertId" value={alert.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                        삭제
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {posts.length === 0 ? (
        <div className="rounded-xl border border-[#e8e8e8] bg-white p-6 text-center text-sm text-[#888]">
          {hasFilters
            ? '선택한 조건에 맞는 글이 없어요.'
            : '아직 올라온 글이 없어요. 첫 글을 남겨보세요.'}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                price: post.price ? post.price.toString() : null,
                thumbnailUrl: post.images[0]?.url ?? null,
                commentCount: post._count.comments,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
