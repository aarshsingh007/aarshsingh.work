"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";
import Preloader from "@/components/preloader/Preloader";

const IntroContext = createContext(false);

/** True once the preloader has finished, was skipped, or was already seen. */
export function useIntroReady() {
  return useContext(IntroContext);
}

export default function IntroProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  // Defer a frame: on repeat visits onComplete fires inside the very first
  // commit, before motion components have set up their animation state, and
  // flipping `ready` in that same commit leaves the entrance stuck at its
  // initial (hidden) values.
  const onComplete = useCallback(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  return (
    <IntroContext.Provider value={ready}>
      <Preloader contentId="site-content" onComplete={onComplete} />
      {/* reducedMotion="user": transforms are dropped, opacity fades remain. */}
      <MotionConfig reducedMotion="user">
        <div id="site-content">{children}</div>
      </MotionConfig>
    </IntroContext.Provider>
  );
}
