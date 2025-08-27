import type { Post, TagFilterItem } from '@/types/blog';
import { Client, PageObjectResponse } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { unstable_cache } from 'next/cache';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

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
  post: Post;
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

  const mdblocks = await n2m.pageToMarkdown(response.results[0].id);
  const { parent } = n2m.toMarkdownString(mdblocks);

  return {
    markdown: parent,
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
  ['posts'],
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
