import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, SkipForward, Loader2 } from "lucide-react";

type GameStatus = "waiting" | "active" | "paused" | "finished";

interface GameControlsProps {
  gameStatus: GameStatus;
  onStartGame: () => void;
  onPauseGame: () => void;
  onStopGame: () => void;
  onNextQuestion: (forceSkip?: boolean) => void;
  isAdvancingQuestion?: boolean;
  questionCooldownTime?: number;
}

export const GameControls = ({
  gameStatus,
  onStartGame,
  onPauseGame,
  onStopGame,
  onNextQuestion,
  isAdvancingQuestion = false,
  questionCooldownTime = 0,
}: GameControlsProps) => {
  const handleNextQuestionClick = (event: React.MouseEvent) => {
    const forceSkip = event.shiftKey; // Hold Shift for confirmation dialog
    onNextQuestion(forceSkip);
  };
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Game Controls</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Button
          onClick={onStartGame}
          disabled={gameStatus === "active"}
          className="min-h-[60px] bg-green-600 hover:bg-green-700"
        >
          <Play className="mr-2 h-5 w-5" />
          Start Game
        </Button>
        <Button
          onClick={onPauseGame}
          disabled={gameStatus !== "active"}
          className="min-h-[60px] bg-yellow-600 hover:bg-yellow-700"
        >
          <Pause className="mr-2 h-5 w-5" />
          Pause
        </Button>
        <Button
          onClick={onStopGame}
          variant="destructive"
          className="min-h-[60px]"
        >
          <Square className="mr-2 h-5 w-5" />
          Stop Game
        </Button>
        <Button
          onClick={handleNextQuestionClick}
          disabled={
            gameStatus !== "active" ||
            isAdvancingQuestion ||
            questionCooldownTime > 0
          }
          className="min-h-[60px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          title={
            questionCooldownTime > 0
              ? `Question cooldown: ${questionCooldownTime}s remaining. Shift+Click to force skip.`
              : "Click to advance, Shift+Click to force skip with confirmation"
          }
        >
          {isAdvancingQuestion ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <SkipForward className="mr-2 h-5 w-5" />
          )}
          {isAdvancingQuestion
            ? "Advancing..."
            : questionCooldownTime > 0
              ? `Next Question (${questionCooldownTime}s)`
              : "Next Question"}
        </Button>
      </div>

      {/* Help text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          💡 <strong>Tip:</strong> "Next Question" has a 60-second cooldown to
          prevent accidental clicks. Hold{" "}
          <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
            Shift
          </kbd>{" "}
          while clicking to force skip with confirmation
        </p>
      </div>
    </Card>
  );
};
