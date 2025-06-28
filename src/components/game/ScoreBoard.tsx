
import { Card } from '@/components/ui/card';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';

interface ScoreBoardProps {
  scores: Record<string, number>;
  currentTeam: string;
}

export const ScoreBoard = ({ scores, currentTeam }: ScoreBoardProps) => {
  const sortedTeams = Object.entries(scores)
    .map(([id, score]) => ({
      id,
      ...TEAMS[id],
      score
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Team Scores</h3>
      
      <div className="space-y-3">
        {sortedTeams.map((team, index) => {
          const isCurrentTeam = team.id === currentTeam;
          const rank = index + 1;
          
          return (
            <div 
              key={team.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isCurrentTeam ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${
                    rank === 1 ? 'text-yellow-600' : 
                    rank === 2 ? 'text-gray-600' : 
                    rank === 3 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    #{rank}
                  </span>
                  {rank <= 3 && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                </div>
                
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: TEAM_COLORS[team.id] }}
                >
                  <Star className="w-4 h-4" />
                </div>
                
                <div>
                  <div className={`font-semibold ${isCurrentTeam ? 'text-blue-900' : 'text-gray-900'}`}>
                    {team.name}
                  </div>
                  <div className="text-xs text-gray-500">{team.heroine}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${isCurrentTeam ? 'text-blue-900' : 'text-gray-900'}`}>
                  {team.score}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
