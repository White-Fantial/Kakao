'use server';

import { requireUser } from '@/lib/auth/session';
import { generateCommentDraft } from '@/lib/ai/generate-comment-draft';
import { getManagedAuthorContext } from '@/lib/ai/managed-author';
import { prisma } from '@/lib/db/prisma';
import { canUseAutoContentGeneration } from '@/lib/permissions';

type GenerateCommentDraftInput = {
  postId: string;
  authorUserIdOverride: string;
  currentCommentBody: string;
};

export type GenerateCommentDraftResult =
  | { ok: true; commentBody: string; message: string }
  | { ok: false; message: string };

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function logAiGenerationAction(
  actorId: string,
  actionType: string,
  reason: string,
) {
  await prisma.moderationAction.create({
    data: {
      actorId,
      targetType: 'AI_GENERATION',
      targetId: actorId,
      actionType,
      reason,
    },
  });
}

export async function generateCommentDraftAction(
  rawInput: GenerateCommentDraftInput,
): Promise<GenerateCommentDraftResult> {
  const user = await requireUser();
  if (!canUseAutoContentGeneration(user)) {
    return { ok: false, message: '자동 생성 기능을 사용할 권한이 없습니다.' };
  }

  const postId = normalizeText(rawInput.postId);
  const authorUserIdOverride = normalizeText(rawInput.authorUserIdOverride);
  const currentCommentBody = normalizeText(rawInput.currentCommentBody);

  if (!postId) {
    return { ok: false, message: '게시글 정보가 올바르지 않습니다.' };
  }

  if (!authorUserIdOverride) {
    return { ok: false, message: '자동 생성을 위해 운영 계정을 선택해 주세요.' };
  }

  const [author, post] = await Promise.all([
    getManagedAuthorContext(authorUserIdOverride),
    prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        country: {
          select: {
            name: true,
          },
        },
        city: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            postTagOption: {
              select: {
                label: true,
              },
            },
          },
        },
        comments: {
          where: { status: 'PUBLISHED' },
          select: {
            body: true,
            author: {
              select: {
                displayName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 40,
        },
      },
    }),
  ]);

  if (!author) {
    return { ok: false, message: '선택한 운영 계정을 사용할 수 없어요.' };
  }

  if (!post || post.status !== 'PUBLISHED') {
    return { ok: false, message: '댓글 추천을 생성할 수 없는 게시글입니다.' };
  }

  const reasonContext = JSON.stringify({
    authorUserIdOverride,
    postId,
    commentCount: post.comments.length,
  });

  try {
    const commentBody = await generateCommentDraft({
      author,
      categoryName: post.category.name,
      categoryType: post.category.type,
      countryName: post.country?.name ?? null,
      cityName: post.city?.name ?? null,
      tags: post.tags.map((tag) => tag.postTagOption.label),
      postTitle: post.title,
      postBody: post.body,
      existingComments: post.comments.map((comment) => ({
        authorDisplayName: comment.author.displayName,
        body: comment.body,
      })),
      currentCommentBody,
    });

    await logAiGenerationAction(user.id, 'COMMENT_DRAFT_GENERATED', reasonContext);

    return {
      ok: true,
      commentBody,
      message: '추천 댓글 초안이 생성되었어요.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    await logAiGenerationAction(
      user.id,
      'COMMENT_DRAFT_GENERATION_FAILED',
      JSON.stringify({ authorUserIdOverride, postId, errorMessage }),
    );
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : '댓글 추천 생성에 실패했어요. 잠시 후 다시 시도해 주세요.',
    };
  }
}
