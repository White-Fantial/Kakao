'use server';

import { Decimal } from '@prisma/client/runtime/library';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  canCreatePost,
  canDeletePost,
  canEditPost,
  canMarkPostAsSold,
} from '@/lib/permissions';
import { SALE_CATEGORY_SLUG } from '@/lib/posts/constants';

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePrice(rawPrice: string) {
  if (!rawPrice) {
    return null;
  }

  const parsed = Number(rawPrice);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return new Decimal(parsed.toFixed(2));
}

async function validateCategoryAndPrice(categoryId: string, rawPrice: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true, type: true },
  });

  if (!category) {
    return { ok: false as const, message: '카테고리를 선택해 주세요.' };
  }

  const price = parsePrice(rawPrice);
  const isSaleCategory = category.slug === SALE_CATEGORY_SLUG;

  if (isSaleCategory && !price) {
    return { ok: false as const, message: '판매글은 가격을 입력해 주세요.' };
  }

  return { ok: true as const, category, price };
}

export async function createPostAction(formData: FormData) {
  const user = await requireUser();

  if (!canCreatePost(user)) {
    redirect('/posts/new?error=권한이 없습니다.');
  }

  const title = normalizeText(formData.get('title'));
  const body = normalizeText(formData.get('body'));
  const categoryId = normalizeText(formData.get('categoryId'));
  const cityId = normalizeText(formData.get('cityId'));
  const rawPrice = normalizeText(formData.get('price'));

  if (!body) {
    redirect('/posts/new?error=글 내용을 입력해 주세요.');
  }

  if (!categoryId) {
    redirect('/posts/new?error=카테고리를 선택해 주세요.');
  }

  if (!cityId) {
    redirect('/posts/new?error=지역을 선택해 주세요.');
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { id: true },
  });

  if (!city) {
    redirect('/posts/new?error=지역을 선택해 주세요.');
  }

  const categoryResult = await validateCategoryAndPrice(categoryId, rawPrice);

  if (!categoryResult.ok) {
    redirect(`/posts/new?error=${encodeURIComponent(categoryResult.message)}`);
  }

  const isSaleCategory = categoryResult.category.slug === SALE_CATEGORY_SLUG;

  await prisma.post.create({
    data: {
      authorId: user.id,
      title: title || null,
      body,
      categoryId,
      cityId,
      price: categoryResult.price,
      status: 'PUBLISHED',
      saleStatus: isSaleCategory ? 'AVAILABLE' : null,
    },
  });

  revalidatePath('/posts');
  revalidatePath('/my/posts');
  redirect('/posts');
}

export async function updatePostAction(formData: FormData) {
  const user = await requireUser();
  const postId = normalizeText(formData.get('postId'));

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, status: true, saleStatus: true },
  });

  if (!post || !canEditPost(user, post)) {
    redirect('/my/posts?error=권한이 없습니다.');
  }

  const title = normalizeText(formData.get('title'));
  const body = normalizeText(formData.get('body'));
  const categoryId = normalizeText(formData.get('categoryId'));
  const cityId = normalizeText(formData.get('cityId'));
  const rawPrice = normalizeText(formData.get('price'));

  if (!body) {
    redirect(`/posts/${postId}/edit?error=글 내용을 입력해 주세요.`);
  }

  if (!categoryId) {
    redirect(`/posts/${postId}/edit?error=카테고리를 선택해 주세요.`);
  }

  if (!cityId) {
    redirect(`/posts/${postId}/edit?error=지역을 선택해 주세요.`);
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { id: true },
  });

  if (!city) {
    redirect(`/posts/${postId}/edit?error=지역을 선택해 주세요.`);
  }

  const categoryResult = await validateCategoryAndPrice(categoryId, rawPrice);

  if (!categoryResult.ok) {
    redirect(
      `/posts/${postId}/edit?error=${encodeURIComponent(categoryResult.message)}`,
    );
  }

  const isSaleCategory = categoryResult.category.slug === SALE_CATEGORY_SLUG;

  await prisma.post.update({
    where: { id: postId },
    data: {
      title: title || null,
      body,
      categoryId,
      cityId,
      price: isSaleCategory ? categoryResult.price : null,
      saleStatus: isSaleCategory ? post.saleStatus ?? 'AVAILABLE' : null,
      status: 'PUBLISHED',
    },
  });

  revalidatePath('/posts');
  revalidatePath('/my/posts');
  revalidatePath(`/posts/${postId}`);
  redirect('/my/posts');
}

export async function deletePostAction(formData: FormData) {
  const user = await requireUser();
  const postId = normalizeText(formData.get('postId'));

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, status: true, saleStatus: true },
  });

  if (!post || !canDeletePost(user, post)) {
    redirect('/my/posts?error=권한이 없습니다.');
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
      deletedReason: 'USER_DELETED',
    },
  });

  revalidatePath('/posts');
  revalidatePath('/my/posts');
  redirect('/my/posts');
}

export async function markPostAsSoldAction(formData: FormData) {
  const user = await requireUser();
  const postId = normalizeText(formData.get('postId'));

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      status: true,
      saleStatus: true,
      category: { select: { slug: true } },
    },
  });

  if (!post || !canMarkPostAsSold(user, post)) {
    redirect('/my/posts?error=권한이 없습니다.');
  }

  if (post.category.slug !== SALE_CATEGORY_SLUG) {
    redirect('/my/posts?error=판매글만 판매완료 처리할 수 있어요.');
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      saleStatus: 'SOLD',
    },
  });

  revalidatePath('/posts');
  revalidatePath('/my/posts');
  revalidatePath(`/posts/${postId}`);
  redirect('/my/posts');
}
