import Link from 'next/link';
import { PostCard } from '@/components/features/blog/PostCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TagSection from './_components/TagSection';
import ProfileSection from './_components/ProfileSection';
import ContactSection from './_components/ContactSection';
import { getPublishedPosts, getTagList } from '@/lib/notion';

interface HomeProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { tag } = await searchParams;
  const selectedTag = tag;

  // 서버사이드에서 필터링된 포스트 가져오기
  const [posts, tags] = await Promise.all([getPublishedPosts(selectedTag), getTagList()]);

  return (
    // min-h-screen으로 전체 높이 보장, grid로 3개 영역 분할
    <div className="container py-8">
      <div className="grid grid-cols-[200px_1fr_220px] gap-6">
        {/* 좌측사이드바 */}
        <aside>
          <TagSection tags={tags} selectedTag={selectedTag} />
        </aside>
        <div className="space-y-8">
          {/* 섹션 제목 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {selectedTag && selectedTag !== '전체'
                  ? `${selectedTag} 태그 포스트`
                  : '블로그 목록'}
              </h2>
              {selectedTag && selectedTag !== '전체' && (
                <p className="text-muted-foreground mt-1">총 {posts.length}개의 포스트</p>
              )}
            </div>
            <Select defaultValue="latest">
              <SelectTrigger className="w=[180px]">
                <SelectValue placeholder="정렬 방식 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="oldest">오래된순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 블로그 카드 그리드 */}
          <div className="grid gap-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link href={`/blog/${post.slug}`} key={post.id}>
                  <PostCard key={post.id} post={post} />
                </Link>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-lg">
                  {selectedTag
                    ? `"${selectedTag}" 태그의 포스트가 없습니다.`
                    : '포스트가 없습니다.'}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* 우측 사이드바 */}
        <aside className="flex flex-col gap-6">
          <ProfileSection />
          <ContactSection />
        </aside>
      </div>
    </div>
  );
}
