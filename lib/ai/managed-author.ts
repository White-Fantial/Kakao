import { prisma } from '@/lib/db/prisma';

export type ManagedAuthorContext = {
  id: string;
  displayName: string;
  accountType: 'PERSONA' | 'OPERATOR';
  shortBio: string | null;
  personaNotes: string | null;
  toneNotes: string | null;
  activityNotes: string | null;
};

export async function getManagedAuthorContext(authorUserId: string) {
  const author = await prisma.user.findUnique({
    where: { id: authorUserId },
    select: {
      id: true,
      displayName: true,
      accountType: true,
      isManagedAccount: true,
      isActive: true,
      status: true,
      shortBio: true,
      personaNotes: true,
      toneNotes: true,
      activityNotes: true,
    },
  });

  if (
    !author ||
    !author.isManagedAccount ||
    !author.isActive ||
    author.status !== 'ACTIVE' ||
    (author.accountType !== 'PERSONA' && author.accountType !== 'OPERATOR')
  ) {
    return null;
  }

  return {
    id: author.id,
    displayName: author.displayName,
    accountType: author.accountType,
    shortBio: author.shortBio,
    personaNotes: author.personaNotes,
    toneNotes: author.toneNotes,
    activityNotes: author.activityNotes,
  } satisfies ManagedAuthorContext;
}
