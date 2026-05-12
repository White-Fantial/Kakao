type PostListSkeletonProps = {
  cardCount?: number;
  showFilterSkeleton?: boolean;
};

export function PostListSkeleton({ cardCount = 3, showFilterSkeleton = false }: PostListSkeletonProps) {
  const cardCountWithMinimumOne = Math.max(1, cardCount);

  return (
    <section className="space-y-4" aria-label="게시글 목록 로딩 중">
      <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200" />

      {showFilterSkeleton ? (
        <div className="space-y-3 rounded-xl border border-[#e8e8e8] bg-white p-4">
          <div className="h-4 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="h-10 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-10 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-10 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-10 animate-pulse rounded-lg bg-zinc-200" />
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {Array.from({ length: cardCountWithMinimumOne }, (_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
