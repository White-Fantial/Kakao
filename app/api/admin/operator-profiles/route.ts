import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const profiles = await prisma.operatorProfile.findMany({
    where: { isActive: true },
    select: { id: true, displayName: true, slug: true, avatarUrl: true },
    orderBy: { displayName: 'asc' },
  });

  return NextResponse.json(profiles);
}
