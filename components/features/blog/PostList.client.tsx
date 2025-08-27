'use client';

import { Post } from '@/types/blog';
import Link from 'next/link';
import { PostCard } from './PostCard';
import { useState, useEffect } from 'react';

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch('/api/posts');
      const data = await res.json();

      setPosts(data.posts);
    };
    fetchPosts();
  }, []);
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
