import Link from 'next/link';

import { loginWithKakaoPlaceholder } from '@/app/login/actions';

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const demoUsers = [
  { kakaoId: 'demo-user-001', displayName: '데모 사용자', role: 'USER' },
  {
    kakaoId: 'demo-coordinator-001',
    displayName: '데모 운영진',
    role: 'COORDINATOR',
  },
  { kakaoId: 'demo-admin-001', displayName: '데모 관리자', role: 'ADMIN' },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">로그인</h1>
      <p className="text-sm text-zinc-700">
        카카오 로그인 연동 전까지 사용할 임시 로그인입니다.
      </p>
      <p className="text-xs text-zinc-500">
        TODO(Phase 1): NextAuth/Auth.js Kakao Provider 또는 커스텀 OAuth 콜백으로 교체하세요.
      </p>
      {params.error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
          로그인이 필요해요.
        </p>
      ) : null}
      <div className="space-y-2">
        {demoUsers.map((user) => (
          <form key={user.kakaoId} action={loginWithKakaoPlaceholder}>
            <input type="hidden" name="kakaoId" value={user.kakaoId} />
            <input type="hidden" name="displayName" value={user.displayName} />
            <input type="hidden" name="role" value={user.role} />
            <button
              type="submit"
              className="w-full rounded-md border bg-white px-4 py-2 text-left"
            >
              {user.displayName}로 시작하기
            </button>
          </form>
        ))}
      </div>
      <Link href="/posts" className="text-sm underline">
        홈으로 이동
      </Link>
    </section>
  );
}
