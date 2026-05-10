import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth/session';
import { canHoldPost, canMakeFinalUserDecision } from '@/lib/permissions';

export async function HeaderNavConditional() {
  const currentUser = await getCurrentUser();

  return (
    <>
      {currentUser && canHoldPost(currentUser) ? (
        <Link
          href="/coordinator"
          className="shrink-0 rounded-full border border-[#e8e8e8] bg-white px-3 py-1.5 font-medium text-[#1a1a1a] hover:border-[#fee500] hover:bg-[#fffde7]"
        >
          운영 관리
        </Link>
      ) : null}
      {currentUser && canMakeFinalUserDecision(currentUser) ? (
        <Link
          href="/admin"
          className="shrink-0 rounded-full border border-[#e8e8e8] bg-white px-3 py-1.5 font-medium text-[#1a1a1a] hover:border-[#fee500] hover:bg-[#fffde7]"
        >
          관리자
        </Link>
      ) : null}
    </>
  );
}
