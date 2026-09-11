import type { CertKind } from "../../data/catalogue";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function FoodSafeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <path d="M6 2v7a2 2 0 0 0 2 2v11" />
      <path d="M6 2v6M9 2v6" />
      <path d="M17 2c-1.7 0-3 2-3 5s1 5 2 5v10" />
    </svg>
  );
}

function DishwasherIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M8 12a4 4 0 1 1 7.2 2.4" />
      <path d="M15.6 11 17 9.6M15.6 11l1.7.5" />
      <circle cx="7" cy="6.3" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FreezerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
      <path d="M12 2 9.8 4.2M12 2l2.2 2.2M12 22l-2.2-2.2M12 22l2.2-2.2" />
      <path d="M4.5 6.5 6 3.8M4.5 6.5l3 .3M19.5 6.5 18 3.8m1.5 2.7-3 .3M4.5 17.5 6 20.2m-1.5-2.7 3-.3M19.5 17.5 18 20.2m1.5-2.7-3-.3" />
    </svg>
  );
}

function MicrowaveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <rect x="4.5" y="7" width="11" height="10" rx="1" />
      <path d="M7 12c.6-1 1.4-1 2 0s1.4 1 2 0 1.4-1 2-0" />
      <circle cx="18.5" cy="10" r="0.7" fill="currentColor" stroke="none" />
      <path d="M17 14h3M17 16h3" />
    </svg>
  );
}

function TuvIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <path d="M12 2.5 20 6v6c0 5-3.4 8.2-8 9.5C7.4 20.2 4 17 4 12V6l8-3.5Z" />
      <path d="m8.5 12 2.3 2.3L16 9" />
    </svg>
  );
}

const CERT_META: Record<CertKind, { icon: () => React.ReactNode; label: string }> = {
  food: { icon: FoodSafeIcon, label: "Food-contact safe" },
  dishwasher: { icon: DishwasherIcon, label: "Dishwasher safe" },
  freezer: { icon: FreezerIcon, label: "Freezer safe" },
  microwave: { icon: MicrowaveIcon, label: "Microwave safe" },
  tuv: { icon: TuvIcon, label: "TÜV Rheinland tested" },
};

export function CertBadge({ kind }: { kind: CertKind }) {
  const meta = CERT_META[kind];
  const Icon = meta.icon;
  return (
    <span
      title={meta.label}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-ink-soft"
    >
      <Icon />
      {meta.label}
    </span>
  );
}

export function MaterialBadge({ code }: { code: string }) {
  return (
    <span
      title={`Recyclable material code: ${code}`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 24 24" width="30" height="30" className="text-ink-soft">
        <path
          d="M12 2 22 20H2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <text x="12" y="17.5" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" fontFamily="var(--font-sans)">
          {code}
        </text>
      </svg>
    </span>
  );
}

export function MadeInIndiaBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-dark " +
        className
      }
    >
      <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
        <rect width="24" height="5.33" fill="#FF9933" />
        <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
        <rect y="10.66" width="24" height="5.34" fill="#128807" />
        <circle cx="12" cy="8" r="1.6" fill="none" stroke="#000088" strokeWidth="0.3" />
      </svg>
      Made in India
    </span>
  );
}
