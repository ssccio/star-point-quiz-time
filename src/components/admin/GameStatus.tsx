import { Card } from '@/components/ui/card';
import { Users, Clock, Trophy } from 'lucide-react';

interface GameStatusProps {
  totalConnected: number;
  totalPlayers: number;
  timerRemaining: number;
  currentQuestion: number;
  totalQuestions: number;
}

export const GameStatus = ({
  totalConnected,
  totalPlayers,
  timerRemaining,
  currentQuestion,
  totalQuestions
}: GameStatusProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalConnected}/{totalPlayers}</div>
            <div className="text-sm text-gray-500">Players Connected</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <Clock className="w-8 h-8 text-orange-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{timerRemaining}s</div>
            <div className="text-sm text-gray-500">Time Remaining</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <Trophy className="w-8 h-8 text-purple-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{currentQuestion + 1}/{totalQuestions}</div>
            <div className="text-sm text-gray-500">Current Question</div>
          </div>
        </div>
      </Card>
    </div>
  );
};