import type { ReactNode } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="shrink-0 text-brand-light" {...stroke}>
      {children}
    </svg>
  );
}

/** Each claim with a glyph that says what kind of claim it is. */
const items: { label: string; icon: ReactNode }[] = [
  {
    label: "FDA-approved materials",
    icon: (
      <Icon>
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <path d="m9 12 2 2 4-4" />
      </Icon>
    ),
  },
  {
    label: "IS 10910 compliant",
    icon: (
      <Icon>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="m9 15 2 2 4-4" />
      </Icon>
    ),
  },
  {
    label: "Dishwasher & microwave safe",
    icon: (
      <Icon>
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <rect x="4.5" y="7" width="11" height="10" rx="1" />
        <path d="M7 12c.6-1 1.4-1 2 0s1.4 1 2 0 1.4-1 2 0" />
        <path d="M17.5 9.5h1.5M17.5 13h1.5M17.5 16h1.5" />
      </Icon>
    ),
  },
  {
    label: "TÜV Rheinland tested",
    icon: (
      <Icon>
        <path d="M12 2.5 20 6v6c0 5-3.4 8.2-8 9.5C7.4 20.2 4 17 4 12V6l8-3.5Z" />
        <path d="m8.5 12 2.3 2.3L16 9" />
      </Icon>
    ),
  },
  {
    label: "Made in India",
    icon: (
      <Icon>
        <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </Icon>
    ),
  },
  {
    label: "Distributor enquiries welcome",
    icon: (
      <Icon>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </Icon>
    ),
  },
];

function Run({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="flex shrink-0 gap-12" aria-hidden={duplicate || undefined}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2.5 text-[15px] font-semibold text-paper/85">
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function TrustStrip() {
  return (
    <div className="relative overflow-hidden border-y border-ink/8 bg-ink py-3.5">
      {/* The marquee needs the list twice over so the -50% translate loops
          seamlessly. Only the first copy is exposed to assistive tech, which
          would otherwise read every claim twice. */}
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
        <Run />
        <Run duplicate />
      </div>
    </div>
  );
}
