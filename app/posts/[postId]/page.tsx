import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  deletePostAction,
  markPostAsSoldAction,
} from '@/app/posts/actions';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { SALE_CATEGORY_SLUG } from '@/lib/posts/constants';

export const dynamic = 'force-dynamic';

type PostDetailPageProps = {
  params: Promise<{ postId: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const currentUser = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          openChatUrl: true,
        },
      },
      category: { select: { name: true, slug: true } },
      city: { select: { name: true } },
    },
  });

  if (!post || post.status === 'DELETED') {
    notFound();
  }

  const isOwner = currentUser?.id === post.authorId;
  const canMarkSold =
    isOwner &&
    post.category.slug === SALE_CATEGORY_SLUG &&
    post.saleStatus !== 'SOLD';

  return (
    <article className="space-y-4 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-zinc-100 px-2 py-1">{post.category.name}</span>
        <span className="rounded-full bg-zinc-100 px-2 py-1">{post.city.name}</span>
        {post.saleStatus === 'SOLD' ? (
          <span className="rounded-full bg-zinc-900 px-2 py-1 text-white">판매완료</span>
        ) : null}
      </div>

      {post.title ? <h1 className="text-xl font-semibold">{post.title}</h1> : null}
      <p className="whitespace-pre-wrap text-base leading-7">{post.body}</p>

      {post.price ? (
        <p className="text-sm font-medium">가격: NZD {post.price.toString()}</p>
      ) : null}

      <p className="text-sm text-zinc-500">
        작성자: {post.author.displayName} · {new Date(post.createdAt).toLocaleString('ko-KR')}
      </p>

      {post.author.openChatUrl ? (
        <a
          href={post.author.openChatUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-md border px-3 py-2 text-sm"
        >
          카카오톡으로 연락하기
        </a>
      ) : (
        <p className="text-sm text-zinc-500">작성자가 연락 링크를 등록하지 않았어요.</p>
      )}

      {isOwner ? (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Link href={`/posts/${post.id}/edit`} className="rounded-md border px-3 py-2 text-sm">
            수정
          </Link>
          {canMarkSold ? (
            <form action={markPostAsSoldAction}>
              <input type="hidden" name="postId" value={post.id} />
              <button type="submit" className="rounded-md border px-3 py-2 text-sm">
                판매 완료로 변경
              </button>
            </form>
          ) : null}
          <form action={deletePostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <button type="submit" className="rounded-md border px-3 py-2 text-sm text-red-600">
              삭제하기
            </button>
          </form>
        </div>
      ) : null}

      {/* TODO(Phase 5): comments UI and moderation-ready comment controls. */}
    </article>
  );
}
