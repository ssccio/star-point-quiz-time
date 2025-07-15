import { Card } from '@/components/ui/card';
import { TEAM_COLORS } from '@/utils/constants';
import { TeamMate } from '@/hooks/useGameState';

interface Team {
  id: string;
  name: string;
  heroine: string;
  meaning: string;
  color: string;
}

interface TeamStatusProps {
  team: Team;
  selectedAnswer: string | null;
  teamMates: TeamMate[];
}

export const TeamStatus = ({ team, selectedAnswer, teamMates }: TeamStatusProps) => {
  return (
    <Card className="p-6 text-center">
      <div className="space-y-4">
        <div className="text-green-600 font-semibold text-lg">Answer Submitted!</div>
        <p className="text-gray-600">Waiting for other players...</p>
        <div 
          className="inline-block px-4 py-2 rounded-full text-white font-medium"
          style={{ backgroundColor: TEAM_COLORS[team.id as keyof typeof TEAM_COLORS] }}
        >
          Your answer: {selectedAnswer}
        </div>
        
        {/* Teammates Status */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Team {team.name} Status:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {teamMates.map((mate, index) => (
              <div 
                key={index}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                  mate.hasAnswered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{mate.name}</span>
                {mate.hasAnswered && <span>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};