'use client';

import { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

/**
 * Live "now" that never goes stale.
 *
 * Browsers throttle or pause timers in background tabs and while the PC is
 * idle/asleep, so a plain `setInterval` can leave the UI minutes behind until
 * its next tick. This hook re-syncs immediately when it becomes enabled and
 * whenever the window regains focus or visibility, then ticks every `intervalMs`.
 *
 * @param intervalMs tick period while visible (default 1s)
 * @param enabled    pause updates when false (e.g. modal closed)
 */
export function useNow(intervalMs = 1_000, enabled = true): Dayjs {
  const [now, setNow] = useState<Dayjs>(() => dayjs());

  useEffect(() => {
    if (!enabled) return;

    const sync = () => setNow(dayjs());
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };

    sync();
    const id = window.setInterval(sync, intervalMs);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs]);

  return now;
}
