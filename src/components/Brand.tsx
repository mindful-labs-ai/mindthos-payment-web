/* eslint-disable @next/next/no-img-element */

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <img
        src="/logo.webp"
        alt="마음토스"
        className="h-8 w-auto"
        width={140}
        height={32}
      />
      <p className="text-xs font-medium tracking-wide text-[color:var(--color-ink-muted)]">
        기관 전용 결제
      </p>
      {subtitle ? (
        <p className="text-sm text-[color:var(--color-ink-muted)]">{subtitle}</p>
      ) : null}
    </header>
  );
}
