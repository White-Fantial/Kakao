'use client';

import { useMemo, useState } from 'react';

type Option = {
  id: string;
  label: string;
};

type CategoryOption = Option & {
  slug: string;
};

type PostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryOption[];
  cities: Option[];
  submitLabel: string;
  defaultValues?: {
    postId?: string;
    title?: string | null;
    body?: string;
    categoryId?: string;
    cityId?: string;
    price?: string | null;
  };
  errorMessage?: string;
};

const SALE_CATEGORY_SLUG = 'sale';

export function PostForm({
  action,
  categories,
  cities,
  submitLabel,
  defaultValues,
  errorMessage,
}: PostFormProps) {
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? '');

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const shouldShowPrice = selectedCategory?.slug === SALE_CATEGORY_SLUG;

  return (
    <form action={action} className="space-y-4 rounded-lg border p-4 bg-white">
      {defaultValues?.postId ? (
        <input type="hidden" name="postId" value={defaultValues.postId} />
      ) : null}

      {errorMessage ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">
          제목 추가하기
        </label>
        <input
          id="title"
          name="title"
          defaultValue={defaultValues?.title ?? ''}
          placeholder="제목은 선택사항이에요"
          className="w-full rounded-md border px-3 py-2"
          maxLength={100}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="body" className="text-sm font-medium">
          무슨 이야기를 나누고 싶나요?
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={defaultValues?.body ?? ''}
          required
          rows={8}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          카테고리 선택
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          required
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">카테고리를 선택해 주세요.</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="cityId" className="text-sm font-medium">
          지역 선택
        </label>
        <select
          id="cityId"
          name="cityId"
          defaultValue={defaultValues?.cityId ?? ''}
          required
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">지역을 선택해 주세요.</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.label}
            </option>
          ))}
        </select>
      </div>

      {shouldShowPrice ? (
        <div className="space-y-1">
          <label htmlFor="price" className="text-sm font-medium">
            가격
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="1"
            step="0.01"
            defaultValue={defaultValues?.price ?? ''}
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      ) : (
        <input type="hidden" name="price" value="" />
      )}

      {/* TODO(Phase 4): add external image uploader integration and bind PostImage records. */}

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
