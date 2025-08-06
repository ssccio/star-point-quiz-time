import { useState, useEffect, useCallback } from "react";

export const useGameTimer = (
  initialTime: number,
  isActive: boolean,
  onTimeUp?: () => void
) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [isActive, timeRemaining, onTimeUp]);

  const resetTimer = useCallback(
    (newTime?: number) => {
      setTimeRemaining(newTime ?? initialTime);
    },
    [initialTime]
  );

  return {
    timeRemaining,
    resetTimer,
    isTimeUp: timeRemaining === 0,
  };
};
