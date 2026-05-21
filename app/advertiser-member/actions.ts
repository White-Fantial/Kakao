'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AdProposalStatus } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  canAccessAdvertiserMemberSection,
  canCreateAdProposal,
  canEditAdProposal,
} from '@/lib/permissions';

const ADVERTISER_MEMBER_PROPOSALS_PATH = '/advertiser-member/proposals';

function normalizeText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function redirectAdvertiserMember(query?: Record<string, string>): never {
  if (!query || Object.keys(query).length === 0) {
    redirect(ADVERTISER_MEMBER_PROPOSALS_PATH);
  }

  redirect(`${ADVERTISER_MEMBER_PROPOSALS_PATH}?${new URLSearchParams(query).toString()}`);
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
