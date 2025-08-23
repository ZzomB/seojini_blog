import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { TagFilterItem } from '@/types/blog';

interface TagSectionProps {
  tags: TagFilterItem[];
  selectedTag?: string;
}

export default function TagSection({ tags, selectedTag }: TagSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>태그목록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {tags.map((tag) => {
            const isSelected = tag.name === selectedTag;
            const href = tag.name === '전체' ? '/' : `?tag=${encodeURIComponent(tag.name)}`;

            return (
              <Link href={href} key={tag.id}>
                <div
                  className={`flex items-center justify-between rounded-md p-1.5 text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted-foreground/10'
                  }`}
                >
                  <span>{tag.name}</span>
                  <span>{tag.count}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
