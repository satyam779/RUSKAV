import { AnimatePresence, motion } from "framer-motion";

export function Loader({ progress, visible }: { progress: number; visible: boolean }) {
  const percent = Math.round(progress * 100);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={`Loading Ruskav Food Service Products, ${percent}%`}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="font-script text-4xl text-brand">
            RUSKAV<span className="align-top text-base">®</span>
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.35em] text-ink-soft">
            Food Service Products
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-8 h-px w-40 overflow-hidden bg-ink/10"
          >
            {/* The width is driven by load progress rather than animated, so it
                gets a CSS transition to smooth the jumps between frames. */}
            <div
              className="h-full bg-brand transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-3 text-[11px] tabular-nums tracking-widest text-ink-soft/70">{percent}%</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
