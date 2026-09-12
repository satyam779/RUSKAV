import { useEffect, useRef, useState } from "react";
import { frameStride, shouldLoadFrameSequence } from "../lib/env";

export const FRAME_COUNT = 300;

// Frame filenames are stable across art updates, so browsers happily serve a
// stale copy of the whole sequence. Bump this whenever the frames change.
const FRAMES_VERSION = "3";

/**
 * Frames needed before the page is allowed to appear. The scroll-scrub only
 * needs the frames the visitor has actually scrolled to, so holding the whole
 * page behind all 300 (~7 MB) buys nothing — it just turns a fast site into a
 * 30-second progress bar on a slow connection. These cover the first stretch of
 * hero scroll; the rest stream in behind the live page.
 */
const PRIME_COUNT = 24;

/** Parallel requests while streaming the remainder. */
const STREAM_CONCURRENCY = 6;

/**
 * Never hold the page longer than this, even if the network has stalled. The
 * hero degrades to whichever frames did arrive rather than trapping the
 * visitor on a loading screen.
 */
const REVEAL_TIMEOUT_MS = 6000;

// The original camera-resolution JPEGs, served untouched — no resampling or
// re-encoding anywhere in the pipeline. The folder name contains a space, so
// it has to be percent-encoded here.
export const framePath = (i: number) =>
  `/Products%20Images/ezgif-frame-${String(i).padStart(3, "0")}.jpg?v=${FRAMES_VERSION}`;

/**
 * A sequence position (0..count-1) is not a file number: a sequence that skips
 * frames, or starts partway in, has to be mapped back. Position 1 of a stride-3
 * sequence beginning at frame 150 is file 154.
 */
const fileFor = (position: number, stride: number, first: number) =>
  first + position * stride + 1;

function loadImage(
  index: number,
  images: HTMLImageElement[],
  stride: number,
  first: number
) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    // Frame 1 is what the visitor actually sees first, and on static visits it
    // is the whole hero, so it competes with the bundle rather than queueing
    // behind the other frames.
    if (index === 0) img.fetchPriority = "high";
    // Resolve on error too: one missing frame must not stall the queue, and
    // the Hero already falls back to the nearest frame that did load.
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = framePath(fileFor(index, stride, first));
    images[index] = img;
  });
}

export type FrameSequence = {
  /** 0–1, share of the priming batch that has loaded. */
  progress: number;
  /** The page may be revealed. */
  ready: boolean;
  images: React.RefObject<HTMLImageElement[]>;
  /** False when this visit gets a single static frame instead of the scrub. */
  animated: boolean;
  /** How many frames this visit actually holds — the scrub's resolution. */
  count: number;
};

export type FrameSequenceOptions = {
  /**
   * Take every Nth frame. Left out, the device decides: every frame on a
   * desktop, every third on a phone. Page backdrops pass a coarser figure,
   * since they are scenery rather than the subject.
   */
  stride?: number;
  /**
   * Where to start, as a fraction of the sequence. A caller that only shows
   * the back half should not download the front half — the priming batch would
   * spend itself entirely on frames that never appear.
   */
  from?: number;
};

export function useFrameSequence({
  stride,
  from = 0,
}: FrameSequenceOptions = {}): FrameSequence {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  // Decided once, at mount: the device and connection do not change mid-visit
  // in a way that should swap the hero out from under the reader.
  const [animated] = useState(shouldLoadFrameSequence);
  const [step] = useState(() => Math.max(1, stride ?? frameStride()));
  const first = Math.floor(Math.min(0.95, Math.max(0, from)) * FRAME_COUNT);
  const count = Math.ceil((FRAME_COUNT - first) / step);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = new Array(count);
    imagesRef.current = images;

    const reveal = () => {
      if (cancelled) return;
      setProgress(1);
      setReady(true);
    };

    const revealTimer = setTimeout(reveal, REVEAL_TIMEOUT_MS);
    const finish = () => {
      clearTimeout(revealTimer);
      reveal();
    };

    // Static visits (phone, cellular, reduced motion) load exactly one frame.
    if (!animated) {
      loadImage(0, images, step, first).then(finish);
      return () => {
        cancelled = true;
        clearTimeout(revealTimer);
      };
    }

    const prime = Math.min(PRIME_COUNT, count);
    let primed = 0;
    const primeBatch = Array.from({ length: prime }, (_, i) =>
      loadImage(i, images, step, first).then(() => {
        primed += 1;
        if (!cancelled) setProgress(primed / prime);
      })
    );

    Promise.all(primeBatch).then(() => {
      finish();
      if (cancelled) return;

      // Stream the remainder in order behind the now-visible page, a few at a
      // time so the queue stays in scroll order rather than racing.
      let next = prime;
      const pump = (): Promise<void> => {
        if (cancelled || next >= count) return Promise.resolve();
        const index = next++;
        return loadImage(index, images, step, first).then(pump);
      };
      for (let i = 0; i < STREAM_CONCURRENCY; i++) void pump();
    });

    return () => {
      cancelled = true;
      clearTimeout(revealTimer);
    };
  }, [animated, count, step, first]);

  return { progress, ready, images: imagesRef, animated, count };
}
