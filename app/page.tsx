import PostListSuspense from '@/components/features/blog/PostListSuspense';
import ProfileSection from '@/app/_components/ProfileSection';
import { getTagList } from '@/lib/notion';
import HeaderSection from '@/app/_components/HeaderSection';
import { Suspense } from 'react';
import TagSectionClient from '@/app/_components/TagSection.client';
import PostListSkeleton from '@/components/features/blog/PostListSkeleton';
import TagSectionSkeleton from '@/app/_components/TagSectionSkeleton';
import { getPublishedPosts } from '@/lib/notion';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서지니 블로그',
  description: '일상을 기록한 특별한 블로그',
  keywords: ['blog', '일상', '기록', '일기', '서지니', '호야', '경험'],
  authors: [{ name: 'Jini', url: 'https://github.com/ZzomB' }],
  creator: 'Jini',
  publisher: 'Jini',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '서지니 블로그',
    description: '일상을 기록한 특별한 블로그',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: '서지니 블로그',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: '서지니 블로그',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '서지니 블로그',
    description: '일상을 기록한 특별한 블로그',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/opengraph-image`],
  },
};

interface HomeProps {
  searchParams: Promise<{ tag?: string; sort?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { tag, sort } = await searchParams;
  const selectedTag = tag || '전체';
  const selectedSort = sort || 'latest';

  // 서버사이드에서 필터링된 포스트 가져오기
  const tags = getTagList();
  const postsPromise = getPublishedPosts({ tag: selectedTag, sort: selectedSort });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // 구조화된 데이터 (JSON-LD) - 구글 검색엔진 최적화
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: '서지니 블로그',
    description: '일상을 기록한 특별한 블로그',
    url: siteUrl,
    author: {
      '@type': 'Person',
      name: 'Jini',
      url: 'https://github.com/ZzomB',
    },
    publisher: {
      '@type': 'Person',
      name: 'Jini',
    },
    inLanguage: 'ko-KR',
  };

  return (
    // min-h-screen으로 전체 높이 보장, grid로 3개 영역 분할
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="container py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr_220px]">
        {/* 좌측사이드바 */}
        <aside className="order-2 md:order-none">
          <Suspense fallback={<TagSectionSkeleton />}>
            <TagSectionClient tags={tags} selectedTag={selectedTag} />
          </Suspense>
        </aside>
        <div className="order-3 space-y-8 md:order-none">
          {/* 섹션 제목 */}
          <HeaderSection selectedTag={selectedTag} />
          {/* 블로그 카드 그리드 */}
          <Suspense fallback={<PostListSkeleton />}>
            <PostListSuspense postsPromise={postsPromise} />
          </Suspense>
        </div>
        {/* 우측 사이드바 */}
        <aside className="order-1 flex flex-col gap-6 md:order-none">
          <ProfileSection />
        </aside>
      </div>
    </div>
    </>
  );
}
