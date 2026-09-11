const items = [
  "FDA-approved materials",
  "IS 10910 compliant",
  "Dishwasher & microwave safe",
  "TÜV Rheinland tested",
  "Made in India",
  "Distributor enquiries welcome",
];

export function TrustStrip() {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-ink/8 bg-ink py-3.5">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-10 text-[13px] font-medium uppercase tracking-[0.2em] text-paper/70">
            {item}
            <span className="text-brand-light">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
