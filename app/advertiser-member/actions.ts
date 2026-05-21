'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AdContentStatus, AdProposalStatus } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  canAccessAdvertiserMemberSection,
  canCreateAdProposal,
  canEditAdProposal,
} from '@/lib/permissions';

const ADVERTISER_MEMBER_PROPOSALS_PATH = '/advertiser-member/proposals';
const ADVERTISER_MEMBER_CONTENTS_PATH = '/advertiser-member/contents';

function normalizeText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function redirectAdvertiserMember(query?: Record<string, string>): never {
  return redirectAdvertiserMemberTo(ADVERTISER_MEMBER_PROPOSALS_PATH, query);
}

function redirectAdvertiserMemberTo(
  basePath: string,
  query?: Record<string, string>,
): never {
  if (!query || Object.keys(query).length === 0) {
    redirect(basePath);
  }

  redirect(`${basePath}?${new URLSearchParams(query).toString()}`);
}

async function requireAdvertiserMemberUser() {
  const user = await getCurrentUser();
  if (!user || !(await canAccessAdvertiserMemberSection(user))) {
    redirect('/posts');
  }

  return user;
}

function parseNullableDateTime(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createAdvertiserMemberProposalAction(formData: FormData) {
  const currentUser = await requireAdvertiserMemberUser();

  const advertiserId = normalizeText(formData.get('advertiserId'));
  const title = normalizeText(formData.get('title'));
  const body = normalizeText(formData.get('body'));
  const requestedStartAt = parseNullableDateTime(normalizeText(formData.get('requestedStartAt')) || null);
  const requestedEndAt = parseNullableDateTime(normalizeText(formData.get('requestedEndAt')) || null);
  const requestedBudgetRaw = normalizeText(formData.get('requestedBudget'));
  const requestedLandingUrl = normalizeText(formData.get('requestedLandingUrl')) || null;
  const advertisedProductCode = normalizeText(formData.get('advertisedProductCode')) || null;

  if (!advertiserId || !title || !body) {
    redirectAdvertiserMember({ error: '광고주, 제목, 내용은 필수입니다.' });
  }

  const canCreate = await canCreateAdProposal(currentUser, advertiserId);
  if (!canCreate) {
    redirectAdvertiserMember({ error: '선택한 광고주에 제안을 등록할 권한이 없습니다.' });
  }

  const requestedBudget = requestedBudgetRaw ? Number(requestedBudgetRaw) : null;
  const proposal = await prisma.adProposal.create({
    data: {
      advertiserId,
      submittedByUserId: currentUser.id,
      status: 'SUBMITTED',
      title,
      body,
      requestedStartAt,
      requestedEndAt,
      requestedBudget,
      requestedLandingUrl,
      advertisedProductCode,
    },
    select: { id: true },
  });

  await prisma.adAuditLog.create({
    data: {
      actorId: currentUser.id,
      advertiserId,
      proposalId: proposal.id,
      actionType: 'PROPOSAL_SUBMITTED_BY_MEMBER',
      message: '광고주 멤버가 광고 제안을 등록했습니다.',
    },
  });

  revalidatePath(ADVERTISER_MEMBER_PROPOSALS_PATH);
  revalidatePath('/ads-manager/proposals');
  redirectAdvertiserMember({ success: '광고 제안이 등록되었습니다.' });
}

export async function updateAdvertiserMemberProposalAction(formData: FormData) {
  const currentUser = await requireAdvertiserMemberUser();

  const proposalId = normalizeText(formData.get('id'));
  const status = normalizeText(formData.get('status')) as AdProposalStatus;
  const negotiationNotes = normalizeText(formData.get('negotiationNotes')) || null;
  const rejectedReason = normalizeText(formData.get('rejectedReason')) || null;

  if (!proposalId || !status) {
    redirectAdvertiserMember({ error: '제안 ID와 상태는 필수입니다.' });
  }

  const validStatuses: AdProposalStatus[] = [
    'SUBMITTED',
    'IN_NEGOTIATION',
    'NEGOTIATED',
    'REJECTED',
  ];
  if (!validStatuses.includes(status)) {
    redirectAdvertiserMember({ error: '유효하지 않은 제안 상태입니다.' });
  }

  const proposal = await prisma.adProposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      advertiserId: true,
      status: true,
      submittedByUserId: true,
    },
  });
  if (!proposal) {
    redirectAdvertiserMember({ error: '광고 제안을 찾을 수 없습니다.' });
  }

  const canEdit = await canEditAdProposal(currentUser, proposal);
  if (!canEdit) {
    redirectAdvertiserMember({ error: '광고 제안을 수정할 권한이 없습니다.' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.adProposal.update({
      where: { id: proposalId },
      data: {
        status,
        negotiationNotes,
        rejectedReason,
        negotiatedByUserId:
          status === 'IN_NEGOTIATION' || status === 'NEGOTIATED' || status === 'REJECTED'
            ? currentUser.id
            : null,
      },
    });

    await tx.adAuditLog.create({
      data: {
        actorId: currentUser.id,
        advertiserId: proposal.advertiserId,
        proposalId: proposal.id,
        actionType: 'PROPOSAL_STATUS_CHANGED_BY_MEMBER',
        message: `광고주 멤버가 광고 제안 상태를 ${status}(으)로 변경했습니다.`,
        metadata: { from: proposal.status, to: status },
      },
    });
  });

  revalidatePath(ADVERTISER_MEMBER_PROPOSALS_PATH);
  revalidatePath('/ads-manager/proposals');
  redirectAdvertiserMember({ success: '광고 제안이 수정되었습니다.' });
}

export async function reviewAdvertiserMemberAdContentAction(formData: FormData) {
  const currentUser = await requireAdvertiserMemberUser();

  const contentId = normalizeText(formData.get('id'));
  const status = normalizeText(formData.get('status')) as AdContentStatus;
  const reviewNotes = normalizeText(formData.get('reviewNotes')) || null;

  if (!contentId || !status) {
    redirectAdvertiserMemberTo(ADVERTISER_MEMBER_CONTENTS_PATH, {
      error: '콘텐츠 ID와 리뷰 결과는 필수입니다.',
      ...(contentId ? { contentId } : {}),
    });
  }

  const validStatuses: AdContentStatus[] = ['REQUEST_CHANGES', 'APPROVED'];
  if (!validStatuses.includes(status)) {
    redirectAdvertiserMemberTo(ADVERTISER_MEMBER_CONTENTS_PATH, {
      error: '유효하지 않은 리뷰 상태입니다.',
      contentId,
    });
  }

  if (status === 'REQUEST_CHANGES' && !reviewNotes) {
    redirectAdvertiserMemberTo(ADVERTISER_MEMBER_CONTENTS_PATH, {
      error: '수정 요청 시 수정 내용을 입력해 주세요.',
      contentId,
    });
  }

  const content = await prisma.adContent.findUnique({
    where: { id: contentId },
    select: { id: true, advertiserId: true, status: true },
  });

  if (!content) {
    redirectAdvertiserMemberTo(ADVERTISER_MEMBER_CONTENTS_PATH, {
      error: '광고 콘텐츠를 찾을 수 없습니다.',
      contentId,
    });
  }

  const membership = await prisma.advertiserMember.findFirst({
    where: {
      advertiserId: content.advertiserId,
      userId: currentUser.id,
      isActive: true,
    },
    select: { id: true },
  });
  if (!membership) {
    redirectAdvertiserMemberTo(ADVERTISER_MEMBER_CONTENTS_PATH, {
      error: '해당 광고 콘텐츠를 리뷰할 권한이 없습니다.',
      contentId,
    });
  }

  if (content.status !== 'REVIEW' && content.status !== 'REQUEST_CHANGES') {
    redirectAdvertiserMemberTo(ADVERTISER_MEMBER_CONTENTS_PATH, {
      error: '리뷰 가능한 상태의 콘텐츠가 아닙니다.',
      contentId,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.adContent.update({
      where: { id: contentId },
      data: {
        status,
        reviewNotes,
        reviewedByUserId: currentUser.id,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedAt: null,
      },
    });

    await tx.adAuditLog.create({
      data: {
        actorId: currentUser.id,
        advertiserId: content.advertiserId,
        adContentId: content.id,
        actionType: 'CONTENT_REVIEWED_BY_MEMBER',
        message:
          status === 'APPROVED'
            ? '광고주 멤버가 광고 콘텐츠를 승인했습니다.'
            : '광고주 멤버가 광고 콘텐츠 수정을 요청했습니다.',
        metadata: {
          from: content.status,
          to: status,
          reviewNotes,
        },
      },
    });
  });

  revalidatePath(ADVERTISER_MEMBER_CONTENTS_PATH);
  revalidatePath('/ads-manager/contents');
  revalidatePath('/ads-manager/campaigns');

  redirectAdvertiserMemberTo(ADVERTISER_MEMBER_CONTENTS_PATH, {
    success: status === 'APPROVED' ? '콘텐츠를 승인했습니다.' : '수정 요청을 전달했습니다.',
    contentId,
  });
}
