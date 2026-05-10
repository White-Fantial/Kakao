'use client';

import { useFormStatus } from 'react-dom';

type FormSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
};

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  className = '',
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const composedClassName = className
    ? `${className} disabled:cursor-not-allowed disabled:opacity-60`
    : 'disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={composedClassName}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
