import type { ReactNode } from 'react';

type ReportMoreMenuProps = {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  contentClassName?: string;
};

export function ReportMoreMenu({ children, className = '', panelClassName = '', contentClassName = '' }: ReportMoreMenuProps) {
  return (
    <details className={`group relative ${className}`}>
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[#e8e8e8] text-lg leading-none text-[#777] transition hover:bg-[#f7f7f7]"
        aria-label="더보기"
      >
        ⋯
      </summary>
      <div
        className={`absolute right-0 top-10 z-20 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-[#e8e8e8] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${panelClassName}`}
      >
        <details className="group/report space-y-2">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-sm text-[#444] hover:bg-[#f7f7f7]">
            <span>신고하기</span>
            <span aria-hidden="true" className="text-xs text-[#999] transition-transform group-open/report:rotate-180">
              ▼
            </span>
          </summary>
          <div className={`space-y-2 border-t border-[#f0f0f0] px-1 pt-2 ${contentClassName}`}>
            {children}
          </div>
        </details>
      </div>
    </details>
  );
}
