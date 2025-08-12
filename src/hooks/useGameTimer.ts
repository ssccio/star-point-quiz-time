import { useState, useEffect, useCallback, useRef } from "react";

export const useGameTimer = (
  initialTime: number,
  isActive: boolean,
  onTimeUp?: () => void
) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      // Set start time when timer becomes active
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        console.log(
          `Timer started at ${new Date(startTimeRef.current).toISOString()}, duration: ${initialTime}s`
        );
      }

      // Calculate actual time remaining based on elapsed time
      const updateTimer = () => {
        if (startTimeRef.current === null) return;

        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, initialTime - elapsed);

        setTimeRemaining(remaining);

        if (remaining === 0 && onTimeUp) {
          console.log(`Timer expired! Calling onTimeUp`);
          onTimeUp();
        }
      };

      // Update immediately and then set interval
      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);

      // Handle visibility change to recalculate timer when tab becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden && startTimeRef.current !== null) {
          updateTimer();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
    // Removed problematic else-if condition that was firing during state transitions
    // The timer expiration is already handled within the main timer logic above
  }, [isActive, initialTime, onTimeUp]);

  const resetTimer = useCallback(
    (newTime?: number) => {
      const resetTime = newTime ?? initialTime;
      setTimeRemaining(resetTime);
      // Always reset the start time when timer is reset - the useEffect will handle activation
      startTimeRef.current = null;
      console.log(`Timer reset to ${resetTime} seconds, start time cleared`);
    },
    [initialTime]
  );

  return {
    timeRemaining,
    resetTimer,
    isTimeUp: timeRemaining === 0,
  };
};
