import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="grid grid-cols-[200px_1fr_220px] gap-6">
        {/* 좌측사이드바 - 태그 목록 스켈레톤 */}
        <aside>
          <div className="space-y-4">
            <Skeleton className="h-6 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-6" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div className="space-y-8">
          {/* 헤더 섹션 스켈레톤 */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>

          {/* 블로그 카드 그리드 스켈레톤 */}
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-card/50 border-border/40 overflow-hidden rounded-xl border py-0"
              >
                {/* 이미지 영역 스켈레톤 */}
                <div className="relative aspect-[2/1] overflow-hidden">
                  <Skeleton className="absolute inset-0" />
                </div>

                {/* 카드 콘텐츠 스켈레톤 */}
                <div className="space-y-4 p-6">
                  {/* 태그 스켈레톤 */}
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>

                  {/* 제목 스켈레톤 */}
                  <Skeleton className="h-6 w-3/4" />

                  {/* 설명 스켈레톤 */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>

                  {/* 작성자 및 날짜 스켈레톤 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측 사이드바 */}
        <aside className="flex flex-col gap-6">
          {/* 프로필 섹션 스켈레톤 */}
          <div className="bg-card space-y-4 rounded-xl border p-6">
            <div className="flex flex-col items-center space-y-3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8" />
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {/* 문의하기 섹션 스켈레톤 */}
          <div className="bg-card space-y-4 rounded-xl border p-6">
            <Skeleton className="h-6 w-20" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
