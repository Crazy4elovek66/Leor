import { useState, useEffect } from 'react';

export function useMinuteTimer() {
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    // Update once every 60 seconds (1 minute)
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);
}
