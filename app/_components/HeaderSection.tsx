import SortSelect from './client/SortSelect';

interface HeaderSectionProps {
  selectedTag: string;
}

export default function HeaderSection({ selectedTag }: HeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {selectedTag && selectedTag !== '전체' ? `${selectedTag} 관련 글` : '블로그 목록'}
        </h2>
      </div>
      <SortSelect />
    </div>
  );
}
