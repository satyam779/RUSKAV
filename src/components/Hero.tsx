import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

/**
 * Poster for the static hero. Deliberately not a frame from the sequence —
 * those are near-white studio renders that disappear behind any scrim dark
 * enough to keep the headline legible. This is a committed, optimised render.
 */
const POSTER = "/gallery/studio-trays-stack.webp";

type Phase = {
  range: [number, number, number, number];
  first?: boolean;
  last?: boolean;
  content: ReactNode;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Trapezoid fade: invisible → in at [a,b] → hold to c → out by d. */
function phaseOpacity(p: number, [a, b, c, d]: Phase["range"], first = false, last = false) {
  if (p <= a) return first ? 1 : 0;
  if (p < b) return (p - a) / (b - a);
  if (p <= c) return 1;
  if (p < d) return 1 - (p - c) / (d - c);
  return last ? 1 : 0;
}

function HeroActions() {
  return (
    <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
      <a
        href="#catalogue"
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-brand"
      >
        Browse the catalogue
      </a>
      <a
        href="#contact"
        className="rounded-full border border-ink/20 bg-paper/40 px-6 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition hover:border-ink/40"
      >
        Get in touch
      </a>
    </div>
  );
}

const phases: Phase[] = [
  {
    range: [0, 0.03, 0.15, 0.22],
    first: true,
    content: (
      <>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
          Ruskav Food Service Products
        </p>
        <h1 className="font-display text-balance text-[13vw] font-medium leading-[0.95] text-ink sm:text-6xl md:text-7xl">
          Serving quality,
          <br /> tray after tray.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-ink-soft md:text-lg">
          Trusted across schools, hospitals, cafeterias and QSRs nationwide.
        </p>
      </>
    ),
  },
  {
    range: [0.2, 0.3, 0.42, 0.5],
    content: (
      <>
        <h2 className="font-display text-balance text-[10vw] font-medium leading-[1] text-ink sm:text-5xl md:text-6xl">
          Engineered for
          <br /> the rush.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-ink-soft md:text-lg">
          FDA-approved ABS &amp; Co-Polymer, tested to IS 10910 — dishwasher and
          microwave safe by design.
        </p>
      </>
    ),
  },
  {
    range: [0.48, 0.58, 0.7, 0.78],
    content: (
      <>
        <h2 className="font-display text-balance text-[10vw] font-medium leading-[1] text-ink sm:text-5xl md:text-6xl">
          A finish for
          <br /> every table.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-ink-soft md:text-lg">
          Ten-plus colourways and scratch-hiding textures, from cafeteria trays to
          fine dinnerware.
        </p>
      </>
    ),
  },
  {
    range: [0.76, 0.86, 0.98, 1],
    last: true,
    content: (
      <>
        <h2 className="font-display text-balance text-[10vw] font-medium leading-[1] text-ink sm:text-5xl md:text-6xl">
          Proudly made
          <br /> in India.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-ink-soft md:text-lg">
          TÜV Rheinland tested. Distributor and dealer enquiries welcome nationwide.
        </p>
        <HeroActions />
      </>
    ),
  },
];

/**
 * Static hero for visits that skip the frame sequence — `prefers-reduced-motion`,
 * Save-Data and 2G. Phones do get the scrub now, at a third of the frames. One
 * frame, one screen, no scroll-jacking: the four scroll phases collapse into a
 * single headline.
 */
function StaticHero() {
  return (
    <section id="top" className="relative min-h-[88svh] overflow-hidden bg-studio">
      <img
        src={POSTER}
        alt="A stack of Ruskav compartment trays in ten colourways."
        width={1400}
        height={1400}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-paper/85 via-paper/75 to-paper/95" />

      <div className="relative grid min-h-[88svh] place-items-center px-6 py-24">
        <div className="w-full max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
            Ruskav Food Service Products
          </p>
          <h1 className="font-display text-balance text-[12vw] font-medium leading-[0.98] text-ink sm:text-5xl md:text-6xl">
            Serving quality, tray after tray.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-balance text-base text-ink-soft">
            Trusted across schools, hospitals, cafeterias and QSRs nationwide —
            FDA-approved, dishwasher and microwave safe, proudly made in India.
          </p>
          <HeroActions />
        </div>
      </div>
    </section>
  );
}

export function Hero({
  images,
  ready,
  animated,
  count,
}: {
  images: RefObject<HTMLImageElement[]>;
  ready: boolean;
  animated: boolean;
  /** Frames this visit holds; a phone scrubs a third of the desktop sequence. */
  count: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);
  /** Index actually painted, which may be a fallback for one still loading. */
  const paintedRef = useRef(-1);

  useEffect(() => {
    if (!animated) return;

    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d");
    const applySmoothing = () => {
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    applySmoothing();

    const isLoaded = (img?: HTMLImageElement) => !!img && img.complete && img.naturalWidth > 0;

    /**
     * Frames now stream in behind the live page, so the exact frame for a
     * scroll position may not have arrived yet. Search outward for the closest
     * one that has — a neighbouring frame is imperceptible, a blank canvas is
     * not.
     */
    const nearestLoaded = (index: number) => {
      const frames = images.current;
      if (!frames) return -1;
      if (isLoaded(frames[index])) return index;
      for (let offset = 1; offset < count; offset++) {
        if (isLoaded(frames[index - offset])) return index - offset;
        if (isLoaded(frames[index + offset])) return index + offset;
      }
      return -1;
    };

    const drawFrame = (index: number) => {
      const img = images.current?.[index];
      if (!img || !ctx) return;

      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    /** Returns whether the frame on screen is the exact one for this scroll position. */
    const render = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;

      const wanted = Math.min(count - 1, Math.round(progress * (count - 1)));
      const available = nearestLoaded(wanted);
      if (available >= 0 && available !== paintedRef.current) {
        paintedRef.current = available;
        drawFrame(available);
      }

      phases.forEach((phase, i) => {
        const el = phaseRefs.current[i];
        if (!el) return;
        const opacity = phaseOpacity(progress, phase.range, phase.first, phase.last);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${(1 - opacity) * (progress > phase.range[2] ? -24 : 24)}px)`;
        el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      });

      if (hintRef.current) {
        hintRef.current.style.opacity = String(1 - clamp01(progress / 0.05));
      }

      return wanted === available;
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        render();
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      // Resizing a canvas resets all context state, including smoothing.
      applySmoothing();
      paintedRef.current = -1;
      render();
    };

    /**
     * While frames are still arriving, a visitor who stopped scrolling would
     * sit on a fallback frame until they moved again. Re-check a few times a
     * second until the painted frame is the wanted one and the sequence is
     * complete.
     */
    const settle = setInterval(() => {
      const exact = render();
      if (exact && isLoaded(images.current?.[count - 1])) clearInterval(settle);
    }, 400);

    resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      clearInterval(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
    };
  }, [images, ready, animated, count]);

  if (!animated) return <StaticHero />;

  return (
    // Scroll length sets the scrub speed: the shorter the section, the further
    // the sequence travels per flick. 650vh was a long way to push a phone.
    <section id="top" ref={sectionRef} className="relative h-[340vh] bg-studio md:h-[430vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-studio">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-paper/70" />

        <div className="relative grid h-full w-full place-items-center px-6">
          <div className="pointer-events-none grid w-full max-w-3xl place-items-center text-center">
            {phases.map((phase, i) => (
              <div
                key={i}
                ref={(el) => {
                  phaseRefs.current[i] = el;
                }}
                className="col-start-1 row-start-1 will-change-[opacity,transform]"
                style={{ opacity: phase.first ? 1 : 0 }}
              >
                {phase.content}
              </div>
            ))}
          </div>
        </div>

        <div
          ref={hintRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-ink-soft"
        >
          <span className="text-[10px] uppercase tracking-[0.35em]">Scroll</span>
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
            <rect x="1" y="1" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="1.6" fill="currentColor" />
          </svg>
        </div>
      </div>
    </section>
  );
}
