import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PostTagBadge } from '@/components/posts/post-tag-badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
const POST_PREVIEW_LENGTH = 40;

type UserProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });
  if (!user) return { title: '사용자를 찾을 수 없어요' };
  return { title: `${user.displayName} 님의 프로필` };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      profileImageUrl: true,
      createdAt: true,
      city: { select: { name: true } },
      country: { select: { name: true } },
      _count: {
        select: {
          posts: {
            where: { status: { not: 'DELETED' } },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: userId,
      status: { not: 'DELETED' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      city: { select: { name: true } },
      category: {
        select: {
          name: true,
          type: true,
          color: true,
        },
      },
      tags: {
        select: {
          postTagOption: {
            select: { id: true, label: true },
          },
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

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <UserAvatar
            displayName={user.displayName}
            profileImageUrl={user.profileImageUrl}
            className="h-14 w-14"
            sizes="56px"
          />
          <div>
            <p className="text-base font-semibold">{user.displayName}</p>
            {(user.country || user.city) ? (
              <p className="text-sm text-[#888]">
                {[user.country?.name, user.city?.name].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
        <dl className="mt-4 space-y-1 text-sm text-[#555]">
          <div className="flex gap-2">
            <dt className="font-medium text-[#333]">가입일</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-[#333]">게시물 수</dt>
            <dd>{user._count.posts}개</dd>
          </div>
        </dl>
      </div>

      <h2 className="px-1 text-base font-bold">게시물 목록</h2>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-[#e8e8e8] bg-white p-6 text-sm text-[#888]">
          아직 게시물이 없어요.
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const titleText = post.title?.trim() ?? '';
            const bodyPreview = post.body.slice(0, POST_PREVIEW_LENGTH);
            const postHeading = titleText || bodyPreview;
            const thumbnailAlt = titleText
              ? `게시글 썸네일: ${titleText}`
              : '게시글 썸네일: 제목 없는 게시글';

            return (
              <li key={post.id} className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
                <Link href={`/posts/${post.id}`} className="flex gap-3">
                  {post.images[0]?.url ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#e8e8e8]">
                      <Image
                        src={post.images[0].url}
                        alt={thumbnailAlt}
                        fill
                        sizes="(max-width: 640px) 80px, 80px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-[#fffde7] px-2 py-1 font-medium text-[#7a6000]">{post.category.name}</span>
                      <span className="rounded-full bg-[#f5f5f5] px-2 py-1 text-[#555]">{post.city?.name ?? '전 지역'}</span>
                      {post.tags.map((tag) => (
                        <PostTagBadge
                          key={tag.postTagOption.id}
                          label={tag.postTagOption.label}
                          categoryColor={post.category.color}
                        />
                      ))}
                    </div>
                    <h3 className="text-base font-semibold">{postHeading}</h3>
                    <p className="line-clamp-2 text-sm text-[#555]">{post.body}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#888]">
                      <span>댓글 {post._count.comments}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={post.createdAt.toISOString()}>
                        {post.createdAt.toLocaleString('ko-KR')}
                      </time>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
