import Link from 'next/link';

import { logoutAction } from '@/app/login/actions';
import { getCurrentUser } from '@/lib/auth/session';

export async function HeaderAuthButton() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    return (
      <form action={logoutAction}>
        <button type="submit" className="rounded-full border border-[#e8e8e8] px-3 py-1 text-sm font-medium text-[#555] hover:border-[#fee500] hover:bg-[#fffde7]">
          로그아웃
        </button>
      </form>
    );
  }

  return (
    <Link href="/login" className="rounded-full bg-[#fee500] px-3 py-1 text-sm font-semibold text-[#3c1e1e] hover:bg-[#f5db00]">
      로그인
    </Link>
  );
}
