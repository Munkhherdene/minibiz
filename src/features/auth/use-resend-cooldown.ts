import { useEffect, useState } from 'react';

/** Countdown that blocks re-sending a code too often (Supabase rate-limits emails). */
export function useResendCooldown(seconds = 60) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return { remaining, restart: () => setRemaining(seconds) };
}
