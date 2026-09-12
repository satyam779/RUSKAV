const items = [
  "FDA-approved materials",
  "IS 10910 compliant",
  "Dishwasher & microwave safe",
  "TÜV Rheinland tested",
  "Made in India",
  "Distributor enquiries welcome",
];

function Run({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="flex shrink-0 gap-10" aria-hidden={duplicate || undefined}>
      {items.map((item) => (
        <span
          key={item}
          className="flex items-center gap-10 text-[13px] font-medium uppercase tracking-[0.2em] text-paper/75"
        >
          {item}
          <span aria-hidden="true" className="text-brand-light">
            ✦
          </span>
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
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        <Run />
        <Run duplicate />
      </div>
    </div>
  );
}
