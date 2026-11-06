import { useEffect, useState } from 'react';

/**
 * Returns the number of whole seconds left until `targetMs` (epoch ms).
 * Re-renders every second while the countdown is running; returns 0 once elapsed.
 */
export function useCountdown(targetMs: number): number {
  const calc = () => Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState<number>(calc);

  useEffect(() => {
    setSecondsLeft(calc());
    if (!targetMs || targetMs <= Date.now()) return;
    const timer = window.setInterval(() => {
      const left = calc();
      setSecondsLeft(left);
      if (left <= 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);

  return secondsLeft;
}

/** Formats seconds as m:ss (e.g. 9:05). */
export const formatCountdown = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/** Seconds a user must wait before requesting another OTP SMS. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
