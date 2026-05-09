'use client';

import { useEffect } from 'react';

type AppErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function AppError({ error, unstable_retry }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-lg border bg-white p-6 text-center">
      <h2 className="text-lg font-semibold">문제가 발생했어요.</h2>
      <p className="mt-2 text-sm text-zinc-600">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 알려주세요.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        다시 시도
      </button>
    </section>
  );
}
