import { Post } from '@/types/blog';
import Link from 'next/link';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  return (
    <div className="grid gap-4">
      {posts.length > 0 ? (
        posts.map((post, index) => (
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
  );
}
