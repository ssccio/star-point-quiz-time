import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, SkipForward } from 'lucide-react';

type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

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
  onNextQuestion
}: GameControlsProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Game Controls</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          onClick={onStartGame}
          disabled={gameStatus === 'playing'}
          className="min-h-[60px] bg-green-600 hover:bg-green-700"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Game
        </Button>
        <Button 
          onClick={onPauseGame}
          disabled={gameStatus !== 'playing'}
          className="min-h-[60px] bg-yellow-600 hover:bg-yellow-700"
        >
          <Pause className="w-5 h-5 mr-2" />
          Pause
        </Button>
        <Button 
          onClick={onStopGame}
          variant="destructive"
          className="min-h-[60px]"
        >
          <Square className="w-5 h-5 mr-2" />
          Stop Game
        </Button>
        <Button 
          onClick={onNextQuestion}
          disabled={gameStatus !== 'playing'}
          className="min-h-[60px] bg-blue-600 hover:bg-blue-700"
        >
          <SkipForward className="w-5 h-5 mr-2" />
          Next Question
        </Button>
      </div>
    </Card>
  );
};