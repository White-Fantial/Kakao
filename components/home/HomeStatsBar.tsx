type HomeStatsBarProps = {
  todayNewPosts: number;
  activeCityCount: number;
  popularKeywords: string[];
};

export function HomeStatsBar({ todayNewPosts, activeCityCount, popularKeywords }: HomeStatsBarProps) {
  return (
    <section className="rounded-2xl border border-[#e8e8e8] bg-white px-4 py-3 shadow-sm">
      <dl className="grid gap-2 text-sm sm:grid-cols-3 sm:gap-3">
        <div className="rounded-lg bg-[#f9f9f9] px-3 py-2">
          <dt className="text-xs text-[#666]">오늘 새 글</dt>
          <dd className="font-semibold text-[#333]">{todayNewPosts.toLocaleString('ko-KR')}개</dd>
        </div>
        <div className="rounded-lg bg-[#f9f9f9] px-3 py-2">
          <dt className="text-xs text-[#666]">활성 지역</dt>
          <dd className="font-semibold text-[#333]">{activeCityCount.toLocaleString('ko-KR')}개 도시</dd>
        </div>
        <div className="rounded-lg bg-[#f9f9f9] px-3 py-2">
          <dt className="text-xs text-[#666]">인기 키워드</dt>
          <dd className="truncate font-semibold text-[#555]">{popularKeywords.join(' · ')}</dd>
        </div>
      </dl>
    </section>
  );
}
