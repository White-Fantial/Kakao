type EmptyStateMessageProps = {
  title: string;
  description?: string;
};

export function EmptyStateMessage({ title, description }: EmptyStateMessageProps) {
  return (
    <div className="rounded-xl border border-[#e8e8e8] bg-white p-6 text-center">
      <p className="text-sm font-semibold text-[#444]">{title}</p>
      {description ? <p className="mt-2 text-sm text-[#888]">{description}</p> : null}
    </div>
  );
}
