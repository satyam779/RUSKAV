import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 300;

// Frame filenames are stable across art updates, so browsers happily serve a
// stale copy of the whole sequence. Bump this whenever the frames change.
const FRAMES_VERSION = "3";

// The original camera-resolution JPEGs, served untouched — no resampling or
// re-encoding anywhere in the pipeline. The folder name contains a space, so
// it has to be percent-encoded here.
const framePath = (i: number) =>
  `/Products%20Images/ezgif-frame-${String(i).padStart(3, "0")}.jpg?v=${FRAMES_VERSION}`;

export function useFrameSequence() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);

    const onOne = () => {
      loaded += 1;
      if (!cancelled) setProgress(loaded / FRAME_COUNT);
      if (loaded === FRAME_COUNT && !cancelled) {
        imagesRef.current = images;
        setReady(true);
      }
    };

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      img.onload = onOne;
      img.onerror = onOne;
      images[i - 1] = img;
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, []);

  return { progress, ready, images: imagesRef };
}
