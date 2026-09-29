import { LabelIcon } from "./icons/LabelIcon";
import { Link } from "react-router-dom";
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

// Routes, not anchors: the finder and the enquiry form live on their own
// pages, so `#catalogue` and `#contact` on the home page went nowhere.
function HeroActions({ className = "justify-center" }: { className?: string }) {
  return (
    <div className={`pointer-events-auto mt-8 flex flex-wrap items-center gap-3 ${className}`}>
      <Link
        to="/products"
        className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark"
      >
        Browse the range
      </Link>
      <Link
        to="/contact"
        className="rounded-full border border-ink/20 bg-paper/60 px-6 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition hover:border-ink/40"
      >
        Get in touch
      </Link>
    </div>
  );
}

const phases: Phase[] = [
  {
    range: [0, 0.03, 0.15, 0.22],
    first: true,
    content: (
      <>
        <p className="eyebrow-rule mb-4 text-brand">
          <LabelIcon label="Ruskav Food Service Products" />
          Ruskav Food Service Products
        </p>
        <h1 className="font-display text-balance text-[10vw] leading-[0.98] text-ink sm:text-5xl md:text-6xl">
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
        <h2 className="font-display text-balance text-[8.5vw] leading-[1] text-ink sm:text-5xl md:text-6xl">
          Engineered for
          <br /> the rush.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-ink-soft md:text-lg">
          FDA-approved ABS &amp; Co-Polymer, tested to IS 10910. Dishwasher and
          microwave safe by design.
        </p>
      </>
    ),
  },
  {
    range: [0.48, 0.58, 0.7, 0.78],
    content: (
      <>
        <h2 className="font-display text-balance text-[8.5vw] leading-[1] text-ink sm:text-5xl md:text-6xl">
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
        <h2 className="font-display text-balance text-[8.5vw] leading-[1] text-ink sm:text-5xl md:text-6xl">
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
    // Split rather than a photo under a white wash: the colourways are the
    // product, and fading them to pastel is what made this screen look flat.
    <section
      id="top"
      className="relative overflow-hidden bg-paper pb-10 pt-[calc(var(--header-h)+1.75rem)] md:pb-16 md:pt-[calc(var(--header-h)+3.5rem)]"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-[1.05fr_1fr] md:gap-12">
        <div>
          <p className="eyebrow-rule text-brand"><LabelIcon label="Ruskav Food Service Products" />Ruskav Food Service Products</p>
          <h1 className="font-display mt-4 text-balance text-[2.3rem] leading-[1.02] text-ink sm:text-5xl lg:text-[4rem]">
            Serving quality, tray after tray.
          </h1>
          <p className="mt-5 max-w-md text-base text-ink-soft md:text-lg">
            Trusted across schools, hospitals, cafeterias and QSRs nationwide.
          </p>
          <HeroActions className="justify-start" />
        </div>
        <div className="overflow-hidden rounded-[2rem] bg-studio shadow-[0_30px_60px_-35px_rgba(15,27,51,0.55)]">
          <img
            src={POSTER}
            alt="A stack of Ruskav compartment trays in ten colourways."
            width={1400}
            height={1400}
            fetchPriority="high"
            className="aspect-[4/3] h-full w-full object-cover md:aspect-square"
          />
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

    /** Where a frame lands so it covers the canvas, like object-fit: cover. */
    const cover = (img: HTMLImageElement) => {
      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      return [(cw - dw) / 2, (ch - dh) / 2, dw, dh] as const;
    };

    /**
     * Paints the single nearest frame. Blending neighbours showed as a double
     * image on the moving product, so the glide comes from the eased position
     * alone.
     *
     * Returns whether the frame drawn is the exact one for the position.
     */
    const paint = (position: number) => {
      const frames = images.current;
      if (!ctx || !frames) return false;
      const wanted = Math.round(position);
      const base = nearestLoaded(wanted);
      if (base < 0) return false;
      if (base !== paintedRef.current) {
        paintedRef.current = base;
        // Every frame is an opaque JPEG covering the whole canvas, so there is
        // nothing to clear first; clearing only risks a blank flash.
        const [x, y, w, h] = cover(frames[base]);
        ctx.drawImage(frames[base], x, y, w, h);
      }
      return base === wanted;
    };

    /**
     * Decode the next few frames in the direction of travel, so the first
     * draw of each is not stalled by decoding a 1920px JPEG mid-scroll.
     */
    let decodedFrom = -1;
    const decodeAhead = (from: number, direction: number) => {
      if (from === decodedFrom) return;
      decodedFrom = from;
      for (let i = 1; i <= 6; i++) {
        const img = images.current?.[from + i * direction];
        if (img && isLoaded(img)) img.decode().catch(() => {});
      }
    };

    const scrollProgress = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      return scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
    };

    /** Draws everything for a progress value; returns whether the frame is exact. */
    const apply = (progress: number) => {
      const exact = paint(progress * (count - 1));

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

      return exact;
    };

    /**
     * The drawn position eases towards the scroll position instead of jumping
     * to it. A mouse wheel moves the page in ~100px steps, and a sequence that
     * jumps with each one stutters; easing turns the steps into one glide.
     * The easing is scaled by elapsed time, so a 120Hz screen settles at the
     * same speed as a 60Hz one.
     */
    let target = scrollProgress();
    let current = target;
    let raf = 0;
    let lastTime = 0;

    const tick = (now: number) => {
      const dt = lastTime ? Math.min(64, now - lastTime) : 16.7;
      lastTime = now;
      const diff = target - current;
      const step = 1 - Math.pow(1 - 0.16, dt / 16.7);
      current = Math.abs(diff) < 0.0004 ? target : current + diff * step;
      apply(current);
      decodeAhead(Math.round(current * (count - 1)), diff >= 0 ? 1 : -1);
      if (current !== target) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        lastTime = 0;
      }
    };

    const onScroll = () => {
      target = scrollProgress();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      // Full device resolution (up to 2x): the canvas upscales the frames
      // with high-quality smoothing, which is sharper than letting the
      // browser stretch a smaller canvas.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      // Resizing a canvas resets all context state, including smoothing.
      applySmoothing();
      paintedRef.current = -1;
      target = scrollProgress();
      apply(current);
    };

    /**
     * While frames are still arriving, a visitor who stopped scrolling would
     * sit on a fallback frame until they moved again. Re-check a few times a
     * second until the painted frame is the wanted one and the sequence is
     * complete.
     */
    const settle = setInterval(() => {
      const exact = apply(current);
      if (exact && current === target && isLoaded(images.current?.[count - 1])) clearInterval(settle);
    }, 400);

    resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      clearInterval(settle);
      cancelAnimationFrame(raf);
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

        <div className="relative grid h-full w-full place-items-center px-6 pt-[var(--header-h)]">
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
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-ink-soft supports-[height:100svh]:bottom-[calc(100lvh-100svh+2rem)]"
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
