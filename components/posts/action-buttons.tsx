import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ActionTone = 'neutral' | 'like' | 'save';
type ActionSize = 'default' | 'compact';

function resolveToneClassName(tone: ActionTone, active: boolean) {
  if (!active) {
    return 'text-[#666]';
  }

  if (tone === 'like') {
    return 'border-red-200 bg-red-50 text-red-600';
  }

  if (tone === 'save') {
    return 'border-[#fee500] bg-[#fffde7] text-[#7a6000]';
  }

  return 'text-[#666]';
}

function resolveSizeClassName(size: ActionSize) {
  if (size === 'compact') {
    return 'min-h-7 min-w-7 px-2 py-1 text-[11px]';
  }

  return 'min-h-8 min-w-8 px-2.5 py-1 text-xs';
}

function buildActionClassName({
  tone,
  active,
  size,
  className,
}: {
  tone: ActionTone;
  active: boolean;
  size: ActionSize;
  className?: string;
}) {
  return [
    'inline-flex items-center justify-center gap-1 rounded-full border border-[#e8e8e8] transition-colors hover:border-[#fee500] hover:bg-[#fffde7] disabled:cursor-not-allowed disabled:opacity-60',
    resolveSizeClassName(size),
    resolveToneClassName(tone, active),
    className ?? '',
  ].join(' ');
}

type IconActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactNode;
  count?: number;
  tone?: ActionTone;
  active?: boolean;
  size?: ActionSize;
};

export function IconActionButton({
  icon,
  count,
  tone = 'neutral',
  active = false,
  size = 'default',
  className,
  type = 'button',
  ...props
}: IconActionButtonProps) {
  return (
    <button
      type={type}
      className={buildActionClassName({ tone, active, size, className })}
      {...props}
    >
      {icon}
      {typeof count === 'number' ? <span>{count}</span> : null}
    </button>
  );
}

type IconActionLinkProps = {
  href: string;
  icon: ReactNode;
  count?: number;
  tone?: ActionTone;
  active?: boolean;
  size?: ActionSize;
  className?: string;
  'aria-label'?: string;
  title?: string;
};

export function IconActionLink({
  href,
  icon,
  count,
  tone = 'neutral',
  active = false,
  size = 'default',
  className,
  'aria-label': ariaLabel,
  title,
}: IconActionLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className={buildActionClassName({ tone, active, size, className })}
    >
      {icon}
      {typeof count === 'number' ? <span>{count}</span> : null}
    </Link>
  );
}

export function PostActionButtons({
  children,
  withDivider = false,
}: {
  children: ReactNode;
  withDivider?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${withDivider ? 'border-t border-[#f0f0f0] pt-2' : ''}`}>
      {children}
    </div>
  );
}

export function CommentActionButtons({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 ${filled ? 'fill-current' : 'fill-none'} stroke-current`}>
      <path d="M12 21s-6.716-4.35-9.193-8.058C.56 9.605 2.053 5 6.138 5c2.24 0 3.38 1.258 3.862 2.005C10.482 6.258 11.622 5 13.862 5 17.947 5 19.44 9.605 21.193 12.942 18.716 16.65 12 21 12 21Z" />
    </svg>
  );
}

export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 ${filled ? 'fill-current' : 'fill-none'} stroke-current`}>
      <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.2A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <path d="M17 8a3 3 0 1 0-2.816-4H14a3 3 0 0 0 .184 1.04L8.91 8.035A3 3 0 0 0 7 7.33a3 3 0 1 0 1.91 5.295l5.273 2.995A3 3 0 1 0 14 17c0-.35.06-.685.17-.996l5.203-2.958a3 3 0 1 0 0-2.092l-5.203-2.958c.11-.311.17-.646.17-.996h.844A2.996 2.996 0 0 0 17 8Z" />
    </svg>
  );
}
