'use client';

import Link from 'next/link';
import { PostCard } from './PostCard';
import { GetPublishedPostsResponse } from '@/lib/notion';
import { use } from 'react';
import { Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

interface PostListProps {
  postsPromise: Promise<GetPublishedPostsResponse>;
}

export default function PostList({ postsPromise }: PostListProps) {
  const initialData = use(postsPromise);
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort');

  // API 호출 함수
  const fetchPosts = async ({ pageParam }: { pageParam: string | undefined }) => {
    const params = new URLSearchParams();

    if (tag) params.set('tag', tag);
    if (sort) params.set('sort', sort);
    if (pageParam) params.set('startCursor', pageParam);
    // 페이지당 2개씩

    const response = await fetch(`/api/posts?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return response.json();
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['posts', tag, sort],
    queryFn: fetchPosts,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // staleTime: 1000 * 60 * 5, // 5분
    initialData: {
      pages: [initialData],
      pageParams: [undefined],
    },
  });

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // const handleLoadMore = () => {
  //   if (hasNextPage && !isFetchingNextPage) {
  //     fetchNextPage();
  //   }
  // };

  // 모든 페이지의 포스트들을 평탄화 (초기 데이터 + 추가 데이터)
  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {allPosts.length > 0 ? (
          allPosts.map((post, index) => (
            <Link href={`/blog/${post.slug}`} key={post.id}>
              <PostCard key={post.id} post={post} isFirst={index === 0} />
            </Link>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-lg">포스트가 없습니다.</p>
          </div>
        )}
      </div>
      {hasNextPage && !isFetchingNextPage && <div ref={ref} className="h-10"></div>}
      {isFetchingNextPage && (
        <div className="items=center flex justify-center gap-2 py-4">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">로딩중...</span>
        </div>
      )}
      {/* 더보기 버튼 */}
      {/* {hasNextPage && (
        <div>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? '로딩 중...' : '더보기'}
          </Button>
        </div>
      )} */}
    </div>
  );
}
