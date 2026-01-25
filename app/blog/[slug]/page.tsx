import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User } from 'lucide-react';
import { getPostBySlug, getPublishedPosts } from '@/lib/notion';
import { formatDate } from '@/lib/date';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import type { MDXComponents } from 'mdx/types';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';
import { rehypeMdxToElement } from '@/lib/rehype-mdx-to-element';
import { rehypeRemoveNestedAnchors } from '@/lib/rehype-remove-nested-anchors';

// 보안: rehype-sanitize를 사용하여 XSS 공격 방지
// MDX 특수 노드(mdxJsxTextElement)를 일반 element로 변환한 후 sanitize
const customSanitizeSchema: Schema = {
  ...defaultSchema,
  // 허용할 태그 목록에 추가
  tagNames: Array.from(
    new Set([
      ...(Array.isArray(defaultSchema.tagNames) ? defaultSchema.tagNames : []),
      'u',
      'img',
      'video',
      'source',
      'iframe',
      'div',
    ])
  ),
  // 태그별 속성 허용
  attributes: {
    ...(defaultSchema.attributes || {}),
    u: [],
    img: ['src', 'alt', 'class', 'className', 'style'],
    video: ['controls', 'class', 'className', 'style'],
    source: ['src', 'type'],
    iframe: ['src', 'frameborder', 'allow', 'allowfullscreen', 'class', 'className', 'style'],
    div: ['class', 'className', 'style'],
    a: ['href', 'target', 'rel', 'class', 'className', 'style'],
    p: ['class', 'className', 'style'],
    // MDX 컴포넌트들이 사용할 수 있는 기본 속성들 허용
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'style'],
  },
};
//
// 참고: rehype-sanitize를 비활성화하면 밑줄이 정상적으로 나타남
// 보안: Notion API에서 가져온 콘텐츠이므로 XSS 공격 위험이 낮음
// 필요시 최소한의 보안 설정으로 재활성화 가능

import rehypePrettycode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { compile } from '@mdx-js/mdx';
import withSlugs from 'rehype-slug';
import withToc from '@stefanprobst/rehype-extract-toc';
import withTocExport from '@stefanprobst/rehype-extract-toc/mdx';
import GiscusComments from '@/components/GiscusComments';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await getPostBySlug(slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다.',
      description: '포스트를 찾을 수 없습니다.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const canonicalUrl = `${siteUrl}/blog/${slug}`;
  const ogImageUrl = post.coverImage
    ? post.coverImage.startsWith('http')
      ? post.coverImage
      : `${siteUrl}${post.coverImage}`
    : `${siteUrl}/opengraph-image`;

  return {
    title: post.title,
    description: post.description || `${post.title} - 서지니 블로그`,
    keywords: post.tags,
    authors: [{ name: post.author || 'Jini' }],
    publisher: 'Jini',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description || `${post.title} - 서지니 블로그`,
      url: canonicalUrl,
      type: 'article',
      locale: 'ko_KR',
      publishedTime: post.date,
      modifiedTime: post.modifiedDate || post.date,
      authors: post.author || 'Jini',
      tags: post.tags,
      siteName: '서지니 블로그',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 600,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || `${post.title} - 서지니 블로그`,
      images: [ogImageUrl],
    },
  };
}

interface TocEntry {
  value: string;
  depth: number;
  id?: string;
  children?: Array<TocEntry>;
}

export const generateStaticParams = async () => {
  const { posts } = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
};

export const revalidate = 60; // 1분마다 캐시 재검증

function TableOfContentsLink({ item }: { item: TocEntry }) {
  return (
    <div className="space-y-2">
      <Link
        key={item.id}
        href={`#${item.id}`}
        className="hover:text-foreground text-muted-foreground block font-medium transition-colors"
      >
        {item.value}
      </Link>
      {item.children && item.children.length > 0 && (
        <div className="space-y-2 pl-4">
          {item.children.map((subItem) => (
            <TableOfContentsLink key={subItem.id} item={subItem} />
          ))}
        </div>
      )}
    </div>
  );
}

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const { markdown, post } = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 디버깅: 마크다운 콘텐츠 분석 (firstweek 슬러그인 경우에만)
  if (process.env.NODE_ENV === 'development' && slug === 'firstweek') {
    // eslint-disable-next-line no-console
    console.log('🔍 [디버깅] 슬러그:', slug);
    // eslint-disable-next-line no-console
    console.log('🔍 [디버깅] 마크다운 길이:', markdown.length);
    
    // HTML 태그가 제대로 닫혀있는지 확인
    const openTags = markdown.match(/<[^/!][^>]*>/g) || [];
    const closeTags = markdown.match(/<\/[^>]+>/g) || [];
    // eslint-disable-next-line no-console
    console.log('🔍 [디버깅] 열린 태그 수:', openTags.length, '닫힌 태그 수:', closeTags.length);
    
    // 닫히지 않은 태그 찾기
    const tagStack: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    const unclosedTags: Array<{ tag: string; position: number }> = [];
    
    while ((match = tagRegex.exec(markdown)) !== null) {
      const tagName = match[1];
      const isClosing = match[0].startsWith('</');
      const position = match.index;
      
      if (isClosing) {
        if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
          unclosedTags.push({ tag: tagName, position });
        } else {
          tagStack.pop();
        }
      } else {
        // self-closing 태그 체크
        if (!match[0].endsWith('/>')) {
          tagStack.push(tagName);
        }
      }
    }
    
    if (unclosedTags.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 [디버깅] 닫히지 않은 태그:', unclosedTags);
    }
    if (tagStack.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 [디버깅] 닫히지 않은 태그 스택:', tagStack);
    }
    
    // 특수 문자 확인
    const specialChars = markdown.match(/[^\x20-\x7E\n\r\t]/g);
    if (specialChars && specialChars.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 [디버깅] 특수 문자 발견:', specialChars.slice(0, 20));
    }
    
    // 문제가 될 수 있는 HTML 패턴 확인
    const problematicPatterns = [
      /<[^>]*\s+[^=]*=\s*[^"'>\s]+[^>]*>/g, // 따옴표 없는 속성
      /<[^>]*\s+[^=]*=\s*"[^"]*$/gm, // 닫히지 않은 따옴표
      /<[^>]*\s+[^=]*=\s*'[^']*$/gm, // 닫히지 않은 작은따옴표
    ];
    
    problematicPatterns.forEach((pattern, index) => {
      const matches = markdown.match(pattern);
      if (matches && matches.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`🔍 [디버깅] 문제 패턴 ${index + 1} 발견:`, matches.slice(0, 5));
      }
    });
    
    // 마크다운 샘플 출력 (처음 2000자)
    // eslint-disable-next-line no-console
    console.log('🔍 [디버깅] 마크다운 샘플 (처음 2000자):', markdown.substring(0, 2000));
    
    // 마크다운 샘플 출력 (마지막 1000자)
    // eslint-disable-next-line no-console
    console.log('🔍 [디버깅] 마크다운 샘플 (마지막 1000자):', markdown.substring(Math.max(0, markdown.length - 1000)));
    
    // HTML 태그 상세 분석
    const allTags = markdown.match(/<[^>]*>/g);
    if (allTags) {
      // eslint-disable-next-line no-console
      console.log('🔍 [디버깅] 모든 HTML 태그:', allTags);
      
      // img 태그 확인
      const imgTags = markdown.match(/<img[^>]*>/g);
      if (imgTags) {
        // eslint-disable-next-line no-console
        console.log('🔍 [디버깅] img 태그:', imgTags);
        imgTags.forEach((imgTag, index) => {
          // eslint-disable-next-line no-console
          console.log(`🔍 [디버깅] img 태그 ${index + 1}:`, imgTag);
          // eslint-disable-next-line no-console
          console.log(`🔍 [디버깅] img 태그 ${index + 1} 닫혔는지:`, imgTag.endsWith('/>') || imgTag.endsWith('>'));
        });
      }
    }
    
    // 마지막 500자에서 HTML 태그 찾기
    const last500 = markdown.substring(Math.max(0, markdown.length - 500));
    const tagsInLast500 = last500.match(/<[^>]*>/g);
    if (tagsInLast500) {
      // eslint-disable-next-line no-console
      console.log('🔍 [디버깅] 마지막 500자 내 태그:', tagsInLast500);
    }
  }

  // 테스트 1: 마크다운 소스에 <u> 태그가 실제로 있는지 확인
  if (process.env.NODE_ENV === 'development') {
    const underlineMatches = markdown.match(/<u>.*?<\/u>/g);
    // eslint-disable-next-line no-console
    console.log('🔍 [테스트 1] 마크다운 소스의 <u> 태그:', underlineMatches?.length || 0, '개');
    if (underlineMatches && underlineMatches.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 [테스트 1] <u> 태그 샘플:', underlineMatches.slice(0, 3));
    }
  }

  const { data } = await compile(markdown, {
    rehypePlugins: [
      withSlugs,
      withToc,
      withTocExport,
      /** Optionally, provide a custom name for the export. */
      // [withTocExport, { name: 'toc' }],
    ],
  });

  return (
    <div className="container py-6 md:py-12 lg:py-12">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr_240px] md:gap-8">
        <aside className="hidden md:block">{/* 추후콘텐츠 추가 */}</aside>
        <section className="overflow-hidden">
          {/* 블로그 헤더 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                {post.tags?.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">{post.title}</h1>
            </div>

            {/* 메타 정보 */}
            <div className="text-muted-foreground flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>{post.date ? formatDate(post.date) : ''}</span>
              </div>
            </div>
          </div>

          {/* 대표 이미지 */}
          {post.coverImage && (
            <div className="relative mt-6 aspect-[2/1] overflow-hidden rounded-lg">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                priority
                className="object-cover"
              />
            </div>
          )}

          <Separator className="my-8" />
          {/* 모바일 전용 목차 */}
          <div
            className="sticky mb-6 md:hidden"
            style={{ top: 'calc(var(--header-height) + var(--sticky-offset))' }}
          >
            <details className="bg-muted/60 rounded-lg p-4 backdrop-blur-sm">
              <summary className="cursor-pointer text-lg font-semibold">목차</summary>
              <nav className="mt-3 space-y-3 text-sm">
                {data?.toc?.map((item: TocEntry) => (
                  <TableOfContentsLink key={item.id} item={item} />
                ))}
              </nav>
            </details>
          </div>

          {/* 블로그 본문 */}
          <div className="prose prose-slate dark:prose-invert prose-headings:scroll-mt-[var(--header-height)] max-w-none">
            <MDXRemote
              source={markdown}
              // 제미나이 답변: components에서 u 처리 (가장 권장)
              // MDX 파서가 <u>를 만났을 때 rehype-sanitize 과정을 거치기 전에
              // 이미 안전한 리액트 컴포넌트로 치환하려고 시도
              components={
                {
                  u: ({ children, ...props }) => {
                    // 디버깅: u 컴포넌트 호출 확인
                    if (process.env.NODE_ENV === 'development') {
                      // eslint-disable-next-line no-console
                      console.log('🔍 [제미나이 해결책] u 컴포넌트 호출됨:', { children, props });
                    }
                    return <u {...props}>{children}</u>;
                  },
                } as MDXComponents
              }
              options={{
                mdxOptions: {
                  remarkPlugins: [
                    [remarkGfm, { singleTilde: false }], // 단일 ~는 취소선으로 인식하지 않음 (~~만 취소선)
                  ],
                  // MDX는 기본적으로 HTML을 지원하므로 remark-rehype의 allowDangerousHtml 불필요
                  // rehype-raw는 next-mdx-remote-client와 호환되지 않으므로 제거
                  rehypePlugins: [
                    // 보안: MDX 특수 노드를 일반 element로 변환한 후 sanitize
                    // rehype-sanitize가 mdxJsxTextElement를 인식하지 못하므로
                    // 먼저 일반 element로 변환한 후 sanitize
                    rehypeMdxToElement,
                    // rehype-sanitize: HTML을 안전하게 필터링하여 XSS 공격 방지
                    // sanitize 전에 중첩 제거를 시도하지만, sanitize 후에도 다시 확인
                    [rehypeSanitize, customSanitizeSchema],
                    // 중첩된 <a> 태그 제거: hydration 에러 방지
                    // sanitize 후에 실행하여 최종 결과에서 중첩 제거
                    rehypeRemoveNestedAnchors,
                    rehypePrettycode,
                    rehypeSlug,
                  ],
                },
              }}
            />
          </div>

          <Separator className="my-16" />

          {/* 이전/다음 포스트 네비게이션 */}
          <GiscusComments />
        </section>
        <aside className="relative hidden md:block">
          <div
            className="sticky"
            style={{ top: 'calc(var(--header-height) + var(--sticky-offset))' }}
          >
            <div className="bg-muted/50 space-y-4 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold">목차</h3>
              <nav className="space-y-3 text-sm">
                {data?.toc?.map((item) => (
                  <TableOfContentsLink key={item.id} item={item} />
                ))}
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
