import Link from 'next/link';

import { logoutAction } from '@/app/login/actions';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  canAccessAdsManagerSection,
  canAccessAdvertiserMemberSection,
  canAccessCoordinatorSection,
  canAccessOperatorBoard,
  canAccessPartnerManagerSection,
  canMakeFinalUserDecision,
  canModerate,
} from '@/lib/permissions';

export async function HeaderProfileMenu() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const canAccessAdvertiserMember = await canAccessAdvertiserMemberSection(currentUser);
  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { profileImageUrl: true },
  });

  const menuItems: { href: string; label: string }[] = [
    { href: '/my/profile', label: '내 프로필' },
    ...(canAccessOperatorBoard(currentUser) ? [{ href: '/coordinator/board', label: '운영진 게시판' }] : []),
    ...(canAccessCoordinatorSection(currentUser) ? [{ href: '/coordination', label: '코디네이션' }] : []),
    ...(canModerate(currentUser) ? [{ href: '/moderator', label: '모더레이션' }] : []),
    ...(canAccessAdsManagerSection(currentUser) ? [{ href: '/ads-manager/campaigns', label: '광고 매니저' }] : []),
    ...(canAccessPartnerManagerSection(currentUser) ? [{ href: '/partner-manager', label: '파트너 매니저' }] : []),
    ...(canAccessAdvertiserMember
      ? [{ href: '/advertiser-member/campaigns', label: '광고주 멤버' }]
      : []),
    ...(canMakeFinalUserDecision(currentUser) ? [{ href: '/admin', label: '관리자' }] : []),
  ];

  return (
    <details className="relative">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[#e8e8e8] text-sm font-medium text-[#555] hover:border-[#fee500] hover:bg-[#fffde7]"
        aria-label="프로필 메뉴"
      >
        <UserAvatar displayName={currentUser.displayName} profileImageUrl={dbUser?.profileImageUrl} className="h-7 w-7" sizes="28px" />
      </summary>
      <div className="absolute right-0 top-11 z-20 min-w-40 rounded-xl border border-[#e8e8e8] bg-white p-1 shadow-sm">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-[#333] hover:bg-[#f9f9f9]">
            {item.label}
          </Link>
        ))}
        <form action={logoutAction} className="mt-1 border-t border-[#f1f1f1] pt-1">
          <button
            type="submit"
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#333] hover:bg-[#f9f9f9]"
          >
            로그아웃
          </button>
        </form>
      </div>
    </details>
  );
}
