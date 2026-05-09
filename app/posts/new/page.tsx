import { PostForm } from '@/components/posts/post-form';
import { createPostAction } from '@/app/posts/actions';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

type NewPostPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  await requireUser();
  const params = await searchParams;

  const [categories, cities] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.city.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">글쓰기</h1>
      <PostForm
        action={createPostAction}
        categories={categories.map((category) => ({
          id: category.id,
          label: category.name,
          slug: category.slug,
        }))}
        cities={cities.map((city) => ({ id: city.id, label: city.name }))}
        submitLabel="올리기"
        errorMessage={params.error}
      />
    </section>
  );
}
