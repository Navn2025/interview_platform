import { useEffect, useState } from 'react';

function Timer({ startTime, durationMinutes, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!startTime || !durationMinutes) {
      return;
    }

    const startMs = new Date(startTime).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const endMs = startMs + durationMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = endMs - now;

      if (remainingMs <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00');
        if (!expired) {
          setExpired(true);
          if (onExpire) onExpire();
        }
      } else {
        const totalSeconds = Math.floor(remainingMs / 1000);
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        setTimeLeft(`${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onExpire, expired]);

  if (!timeLeft) return null;

  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: expired ? '#d32f2f' : 'inherit' }}>
      {expired ? 'Time is up!' : timeLeft}
    </span>
  );
}

export default Timer;
