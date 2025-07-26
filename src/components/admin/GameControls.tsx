import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, SkipForward } from "lucide-react";

type GameStatus = "waiting" | "active" | "paused" | "finished";

interface GameControlsProps {
  gameStatus: GameStatus;
  onStartGame: () => void;
  onPauseGame: () => void;
  onStopGame: () => void;
  onNextQuestion: () => void;
}

export const GameControls = ({
  gameStatus,
  onStartGame,
  onPauseGame,
  onStopGame,
  onNextQuestion,
}: GameControlsProps) => {
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
          onClick={onNextQuestion}
          disabled={gameStatus !== "active"}
          className="min-h-[60px] bg-blue-600 hover:bg-blue-700"
        >
          <SkipForward className="mr-2 h-5 w-5" />
          Next Question
        </Button>
      </div>
    </Card>
  );
};
