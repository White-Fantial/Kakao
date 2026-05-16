'use client';

import { useState, useTransition } from 'react';

import { reorderCategoriesAction } from '@/app/admin/actions';

type CategoryOrderItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
};

type CategoryDragListProps = {
  initialCategories: CategoryOrderItem[];
};

export function CategoryDragList({ initialCategories }: CategoryDragListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setCategories((prev) => {
      const from = prev.findIndex((category) => category.id === draggedId);
      const to = prev.findIndex((category) => category.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((category, index) => ({ ...category, sortOrder: index }));
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    setDraggedId(null);
    const ids = categories.map((category) => category.id);
    startTransition(async () => {
      await reorderCategoriesAction(ids);
    });
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border border-[#f0f0f0] bg-[#fafafa] p-3">
      <p className="text-xs font-medium text-[#666]">
        드래그로 카테고리 순서 변경
        {isPending ? <span className="ml-2 text-[#aaa]">저장 중…</span> : null}
      </p>
      <ul className="space-y-1.5">
        {categories.map((category) => (
          <li
            key={category.id}
            draggable
            onDragStart={() => handleDragStart(category.id)}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-xs transition-opacity ${
              draggedId === category.id ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <span
              className="cursor-grab text-[#bbb] active:cursor-grabbing"
              title="드래그하여 순서 변경"
              aria-label="드래그하여 순서 변경"
            >
              ⠿
            </span>
            <span className="font-medium text-[#333]">{category.name}</span>
            <span className="rounded-full bg-[#f5f5f5] px-2 py-px text-[#888]">{category.slug}</span>
            <span
              className={`ml-auto rounded-full px-2 py-px ${
                category.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {category.isActive ? '활성' : '비활성'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
