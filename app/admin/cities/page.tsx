import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createCityAction, toggleCityActiveAction } from '@/app/admin/actions';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { canMakeFinalUserDecision } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

type AdminCitiesPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminCitiesPage({ searchParams }: AdminCitiesPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canMakeFinalUserDecision(currentUser)) {
    redirect('/posts');
  }

  const params = await searchParams;

  const cities = await prisma.city.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      sortOrder: true,
      _count: { select: { posts: true } },
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">관리자 — 도시 관리</h1>
        <nav className="flex gap-3 text-sm">
          <Link href="/admin/users" className="font-medium text-[#3c1e1e] underline">사용자</Link>
          <Link href="/admin/posts" className="font-medium text-[#3c1e1e] underline">게시글</Link>
          <Link href="/admin/categories" className="font-medium text-[#3c1e1e] underline">카테고리</Link>
        </nav>
      </div>

      {params.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>
      ) : null}

      <div className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">도시 추가</h2>
        <form action={createCityAction} className="space-y-2">
          <input
            type="text"
            name="name"
            required
            placeholder="도시 이름 (예: Auckland)"
            className="w-full rounded-lg border border-[#e8e8e8] px-3 py-2 text-sm focus:border-[#fee500] focus:outline-none focus:ring-2 focus:ring-[#fee500]/40"
          />
          <input
            type="text"
            name="slug"
            required
            placeholder="슬러그 (예: auckland, 영문 소문자만)"
            pattern="[a-z0-9-]+"
            className="w-full rounded-lg border border-[#e8e8e8] px-3 py-2 text-sm focus:border-[#fee500] focus:outline-none focus:ring-2 focus:ring-[#fee500]/40"
          />
          <button type="submit" className="rounded-xl bg-[#fee500] px-4 py-2 text-sm font-bold text-[#3c1e1e] hover:bg-[#f5db00]">
            추가
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">도시 목록</h2>
        {cities.length === 0 ? (
          <p className="text-sm text-[#888]">도시가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {cities.map((city) => (
              <li key={city.id} className="flex items-center gap-3 rounded-xl border border-[#e8e8e8] p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{city.name}</p>
                  <p className="text-xs text-[#aaa]">
                    슬러그: {city.slug} · 게시글 {city._count.posts}개
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    city.isActive ? 'bg-green-50 text-green-700' : 'bg-[#f5f5f5] text-[#888]'
                  }`}
                >
                  {city.isActive ? '활성' : '비활성'}
                </span>
                <form action={toggleCityActiveAction}>
                  <input type="hidden" name="cityId" value={city.id} />
                  <input type="hidden" name="isActive" value={String(city.isActive)} />
                  <button type="submit" className="rounded-xl border border-[#e8e8e8] px-2 py-1 text-xs font-medium hover:bg-[#f9f9f9]">
                    {city.isActive ? '비활성화' : '활성화'}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
