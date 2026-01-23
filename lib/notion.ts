import type { Post, TagFilterItem } from '@/types/blog';
import { Client, PageObjectResponse } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { unstable_cache } from 'next/cache';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

// HTML 속성 값 이스케이프 함수
function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Notion 블록 타입 정의
interface NotionRichText {
  plain_text: string;
}

interface NotionFile {
  url: string;
}

interface NotionImageBlock {
  image: {
    file?: NotionFile;
    external?: { url: string };
    caption?: NotionRichText[];
  };
}

interface NotionVideoBlock {
  video: {
    file?: NotionFile;
    external?: { url: string };
    caption?: NotionRichText[];
  };
}

interface NotionEmbedBlock {
  embed: {
    url: string;
    caption?: NotionRichText[];
  };
}

interface NotionBookmarkBlock {
  bookmark: {
    url: string;
    caption?: NotionRichText[];
  };
}

// 커스텀 트랜스포머 설정: 이미지, 비디오, 임베드를 적절한 HTML로 변환
n2m.setCustomTransformer('image', async (block) => {
  const { image } = block as NotionImageBlock;
  if (!image) return '';

  const imageUrl = image.file?.url || image.external?.url || '';
  const caption = image.caption || [];
  const captionText = caption.map((item) => item.plain_text).join('') || '';

  if (!imageUrl) return '';

  return `<img src="${escapeHtmlAttribute(imageUrl)}" alt="${escapeHtmlAttribute(captionText)}" />`;
});

n2m.setCustomTransformer('video', async (block) => {
  const { video } = block as NotionVideoBlock;
  if (!video) return '';

  const videoUrl = video.file?.url || video.external?.url || '';
  const caption = video.caption || [];
  const captionText = caption.map((item) => item.plain_text).join('') || '';

  if (!videoUrl) return '';

  // Google Drive 링크 처리
  if (videoUrl.includes('drive.google.com')) {
    const fileIdMatch = videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return `<div class="aspect-video w-full rounded-lg overflow-hidden"><iframe src="${escapeHtmlAttribute(previewUrl)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="w-full h-full"></iframe>${captionText ? `<p class="mt-2 text-sm text-muted-foreground">${escapeHtmlAttribute(captionText)}</p>` : ''}</div>`;
    }
  }

  // 비디오 파일 확장자 확인
  const videoExtension = videoUrl.split('.').pop()?.toLowerCase() || 'mp4';
  const mimeType = videoExtension === 'webm' ? 'video/webm' : 'video/mp4';

  return `<video controls class="w-full rounded-lg">
  <source src="${videoUrl}" type="${mimeType}" />
  ${captionText ? `<p>${captionText}</p>` : ''}
  Your browser does not support the video tag.
</video>`;
});

n2m.setCustomTransformer('embed', async (block) => {
  const { embed } = block as NotionEmbedBlock;
  if (!embed?.url) return '';

  const url = embed.url;
  const caption = embed.caption || [];
  const captionText = caption.map((item) => item.plain_text).join('') || '';

  // Google Drive 링크 처리
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return `<div class="aspect-video w-full rounded-lg overflow-hidden"><iframe src="${escapeHtmlAttribute(previewUrl)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="w-full h-full"></iframe>${captionText ? `<p class="mt-2 text-sm text-muted-foreground">${escapeHtmlAttribute(captionText)}</p>` : ''}</div>`;
    }
  }

  // YouTube URL 처리
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }

    if (videoId) {
      return `<div class="aspect-video w-full rounded-lg overflow-hidden"><iframe src="https://www.youtube.com/embed/${escapeHtmlAttribute(videoId)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full"></iframe>${captionText ? `<p class="mt-2 text-sm text-muted-foreground">${escapeHtmlAttribute(captionText)}</p>` : ''}</div>`;
    }
  }

  // Vimeo URL 처리
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
    if (videoId) {
      return `<div class="aspect-video w-full rounded-lg overflow-hidden"><iframe src="https://player.vimeo.com/video/${escapeHtmlAttribute(videoId)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="w-full h-full"></iframe>${captionText ? `<p class="mt-2 text-sm text-muted-foreground">${escapeHtmlAttribute(captionText)}</p>` : ''}</div>`;
    }
  }

  // 이미지 URL인 경우 (확장자로 판단)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const isImage = imageExtensions.some((ext) => url.toLowerCase().includes(ext));

  if (isImage) {
    return `<img src="${escapeHtmlAttribute(url)}" alt="${escapeHtmlAttribute(captionText)}" class="w-full rounded-lg" />`;
  }

  // 일반 링크 미리보기
  // URL을 <a> 태그 밖으로 분리하여 자동 링크 변환 방지
  const displayText = captionText || '링크 열기';
  return `<div class="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
  <a href="${url}" target="_blank" rel="noopener noreferrer" class="block no-underline">
    <p class="font-medium text-sm break-words">${displayText}</p>
  </a>
  ${!captionText ? `<div class="mt-1 text-xs text-muted-foreground break-all">${url}</div>` : ''}
</div>`;
});

n2m.setCustomTransformer('bookmark', async (block) => {
  const { bookmark } = block as NotionBookmarkBlock;
  if (!bookmark?.url) return '';

  const url = bookmark.url;
  const caption = bookmark.caption || [];
  const captionText = caption.map((item) => item.plain_text).join('') || '';

  // URL을 텍스트로 표시하되, 자동 링크 변환을 방지하기 위해
  // URL을 공백으로 분리하거나 특수 문자를 사용
  // 또는 더 확실하게 하기 위해 URL을 별도의 요소로 분리
  const displayText = captionText || '링크 열기';
  
  // URL을 별도 div로 분리하여 <a> 태그 밖에 배치
  // 이렇게 하면 remarkGfm이 URL을 자동으로 링크로 변환해도 중첩되지 않음
  return `<div class="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
  <a href="${escapeHtmlAttribute(url)}" target="_blank" rel="noopener noreferrer" class="block no-underline">
    <p class="font-medium text-sm break-words">${escapeHtmlAttribute(displayText)}</p>
  </a>
  ${!captionText ? `<div class="mt-1 text-xs text-muted-foreground break-all">${escapeHtmlAttribute(url)}</div>` : ''}
</div>`;
});

function getPostMetadata(page: PageObjectResponse): Post {
  const pageData = page as {
    id: string;
    properties: {
      Title?: { title?: Array<{ plain_text: string }> };
      Description?: { rich_text?: Array<{ plain_text: string }> };
      Slug?: { rich_text?: Array<{ plain_text: string }> };
      Tags?: { multi_select?: Array<{ name: string }> };
      Date?: { date?: { start: string } };
      'Modified Date'?: { date?: { start: string } };
      Author?: {
        people?: Array<{
          object: string;
          id: string;
          name?: string;
          avatar_url?: string;
          type?: string;
          person?: { email?: string };
        }>;
      };
    };
    cover?: {
      external?: { url: string };
      file?: { url: string };
    };
  };

  const properties = pageData.properties;

  // 제목 추출
  const title = properties.Title?.title?.[0]?.plain_text || '';

  // 설명 추출
  const description = properties.Description?.rich_text?.[0]?.plain_text || '';

  // 슬러그 추출
  const slug = properties.Slug?.rich_text?.[0]?.plain_text || page.id;

  // 태그 추출
  const tags = properties.Tags?.multi_select?.map((tag) => tag.name) || [];

  // 날짜 추출
  const date = properties.Date?.date?.start || '';
  const modifiedDate = properties['Modified Date']?.date?.start || '';

  // 작성자 추출 - Notion API 응답 구조에 맞춰 수정
  const authorPeople = properties.Author?.people || [];
  const author = authorPeople.length > 0 ? authorPeople[0].name || 'Unknown' : '';

  // 커버 이미지 추출
  const coverImage = pageData.cover?.external?.url || pageData.cover?.file?.url || '';

  return {
    id: pageData.id,
    title,
    description,
    slug,
    tags,
    date,
    modifiedDate,
    author,
    coverImage,
  };
}

export const getPostBySlug = async (
  slug: string
): Promise<{
  markdown: string;
  post: Post | null;
}> => {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        {
          property: 'Slug',
          rich_text: {
            equals: slug,
          },
        },
        {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
      ],
    },
  });

  if (!response.results[0]) {
    return {
      markdown: '',
      post: null,
    };
  }

  const mdblocks = await n2m.pageToMarkdown(response.results[0].id);
  const { parent } = n2m.toMarkdownString(mdblocks);

  // 밑줄 태그는 그대로 유지 (MDX가 기본적으로 HTML을 지원)
  let processedMarkdown = parent;

  // 잘못된 HTML 태그 제거 (예: <\n\n텍스트\n> 형태)
  // < 로 시작하고 > 로 끝나지만, 태그 이름이 없는 경우를 찾아서 수정
  processedMarkdown = processedMarkdown.replace(/<([^a-zA-Z/!<>]*?)>/g, (match, content) => {
    // 태그 이름이 없고 내용만 있는 경우 (예: <\n텍스트\n>)
    // < 와 > 를 제거하고 내용만 남김
    return content.trim();
  });

  // 디버깅: firstweek 슬러그인 경우 상세 로그
  const postSlug = getPostMetadata(response.results[0] as PageObjectResponse).slug;
  if (process.env.NODE_ENV === 'development' && postSlug === 'firstweek') {
    // eslint-disable-next-line no-console
    console.log('🔍 [Notion] 슬러그:', postSlug);
    // eslint-disable-next-line no-console
    console.log('🔍 [Notion] 원본 마크다운 길이:', processedMarkdown.length);
    
    // HTML 태그 확인
    const htmlTags = processedMarkdown.match(/<[^>]+>/g);
    if (htmlTags) {
      // eslint-disable-next-line no-console
      console.log('🔍 [Notion] HTML 태그 수:', htmlTags.length);
      // eslint-disable-next-line no-console
      console.log('🔍 [Notion] HTML 태그 샘플:', htmlTags.slice(0, 10));
    }
    
    // iframe 태그 확인
    const iframeTags = processedMarkdown.match(/<iframe[^>]*>/g);
    if (iframeTags) {
      // eslint-disable-next-line no-console
      console.log('🔍 [Notion] iframe 태그 수:', iframeTags.length);
      // eslint-disable-next-line no-console
      console.log('🔍 [Notion] iframe 태그:', iframeTags);
    }
    
    // 닫히지 않은 태그 확인 (전체 문자열에서 확인)
    const iframeMatches = processedMarkdown.match(/<iframe[^>]*>/g);
    if (iframeMatches) {
      for (const iframeTag of iframeMatches) {
        const iframeIndex = processedMarkdown.indexOf(iframeTag);
        const afterIframe = processedMarkdown.substring(iframeIndex + iframeTag.length);
        if (!afterIframe.includes('</iframe>')) {
          // eslint-disable-next-line no-console
          console.log('🔍 [Notion] 닫히지 않은 iframe 발견:', iframeTag);
        }
      }
    }
  }

  // 디버깅: 밑줄 패턴 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    const underlineMatches = processedMarkdown.match(/<u>.*?<\/u>/g);
    if (underlineMatches && underlineMatches.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🔍 밑줄 태그 발견:', underlineMatches.slice(0, 5));
    } else {
      // eslint-disable-next-line no-console
      console.log('🔍 밑줄 태그 없음 - 마크다운 샘플:', processedMarkdown.substring(0, 500));
    }
  }

  return {
    markdown: processedMarkdown,
    post: getPostMetadata(response.results[0] as PageObjectResponse),
  };
};

export interface GetPublishedPostsParams {
  tag?: string;
  sort?: string;
  pageSize?: number;
  startCursor?: string;
}

export interface GetPublishedPostsResponse {
  posts: Post[];
  hasMore: boolean;
  nextCursor: string | null;
}

export const getPublishedPosts = unstable_cache(
  async ({
    tag = '전체',
    sort = 'latest',
    pageSize = 2,
    startCursor,
  }: GetPublishedPostsParams = {}): Promise<GetPublishedPostsResponse> => {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter:
        tag && tag !== '전체'
          ? {
              and: [
                {
                  property: 'Status',
                  select: {
                    equals: 'Published',
                  },
                },
                {
                  property: 'Tags',
                  multi_select: {
                    contains: tag,
                  },
                },
              ],
            }
          : {
              property: 'Status',
              select: {
                equals: 'Published',
              },
            },
      sorts: [
        {
          property: 'Date',
          direction: sort === 'latest' ? 'descending' : 'ascending',
        },
      ],
      page_size: pageSize,
      start_cursor: startCursor,
    });

    // Notion API 응답을 Post 타입으로 변환
    const posts: Post[] = response.results
      .filter((page): page is PageObjectResponse => page.object === 'page')
      .map(getPostMetadata);

    return {
      posts,
      hasMore: response.has_more,
      nextCursor: response.next_cursor,
    };
  },
  undefined,
  {
    tags: ['posts'],
    revalidate: 60, // 1분마다 캐시 재검증
  }
);

// 태그 목록을 가져오는 함수
export const getTagList = async (): Promise<TagFilterItem[]> => {
  const { posts } = await getPublishedPosts({ pageSize: 100 });

  // 모든 포스트에서 태그를 수집x
  const tagCountMap = new Map<string, number>();

  posts.forEach((post) => {
    post.tags?.forEach((tag) => {
      const currentCount = tagCountMap.get(tag) || 0;
      tagCountMap.set(tag, currentCount + 1);
    });
  });

  // TagFilterItem 형태로 변환
  const tagList: TagFilterItem[] = [
    // 전체 태그 추가
    {
      id: 'all',
      name: '전체',
      count: posts.length,
    },
    // 각 태그별 정보 추가
    ...Array.from(tagCountMap.entries()).map(([tagName, count]) => ({
      id: tagName.toLowerCase().replace(/\s+/g, '-'),
      name: tagName,
      count,
    })),
  ];

  return tagList;
};

export interface CreatePostParams {
  title: string;
  tags: string;
  content: string;
}

export const createPost = async ({ title, tags, content }: CreatePostParams) => {
  const response = await notion.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID!,
    },
    properties: {
      Title: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
      Description: {
        rich_text: [
          {
            text: {
              content: content,
            },
          },
        ],
      },
      Tags: {
        multi_select: [{ name: tags }],
      },
      Status: {
        select: {
          name: 'Published',
        },
      },
      Date: {
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });
  return response;
};
