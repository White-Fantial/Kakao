'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="bg-zinc-50 p-6 text-zinc-900">
        <section className="mx-auto max-w-xl rounded-lg border bg-white p-6 text-center">
          <h2 className="text-lg font-semibold">서비스 오류가 발생했어요.</h2>
          <p className="mt-2 text-sm text-zinc-600">
            잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            새로 시도
          </button>
        </section>
      </body>
    </html>
  );
}
