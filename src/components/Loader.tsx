import { motion, AnimatePresence } from "framer-motion";

export function Loader({ progress, visible }: { progress: number; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
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
          <div className="mt-8 h-px w-40 overflow-hidden bg-ink/10">
            <motion.div
              className="h-full bg-brand"
              style={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <div className="mt-3 text-[11px] tabular-nums tracking-widest text-ink-soft/70">
            {Math.round(progress * 100)}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
