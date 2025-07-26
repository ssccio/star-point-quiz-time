import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
}

export const Timer = ({ timeRemaining, totalTime }: TimerProps) => {
  const percentage = (timeRemaining / totalTime) * 100;

  const getColorClass = useMemo(() => {
    if (percentage > 50) return "text-green-600";
    if (percentage > 25) return "text-amber-600";
    return "text-red-600";
  }, [percentage]);

  const getProgressColor = useMemo(() => {
    if (percentage > 50) return "#16a34a";
    if (percentage > 25) return "#d97706";
    return "#dc2626";
  }, [percentage]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-center space-x-4">
        <Clock className={`h-6 w-6 ${getColorClass}`} />

        <div className="relative flex-1">
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${percentage}%`,
                backgroundColor: getProgressColor,
              }}
            />
          </div>
        </div>

        <div
          className={`text-2xl font-bold ${getColorClass} min-w-[60px] text-center`}
        >
          {timeRemaining}s
        </div>
      </div>

      {timeRemaining <= 10 && timeRemaining > 0 && (
        <div className="mt-2 text-center">
          <span className="animate-pulse font-semibold text-red-600">
            Time running out!
          </span>
        </div>
      )}
    </Card>
  );
};
