import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function MyProfilePage() {
  const user = await requireUser();

  return (
    <section className="space-y-3 rounded-lg border bg-white p-4">
      <h1 className="text-xl font-semibold">내 프로필</h1>
      <p className="text-sm">이름: {user.displayName}</p>
      <p className="text-sm">역할: {user.role}</p>
      <p className="text-sm">상태: {user.status}</p>
      <p className="text-xs text-zinc-500">
        TODO(Phase 7): 카카오 오픈채팅 링크 등록/수정 UI를 추가하세요.
      </p>
    </section>
  );
}
