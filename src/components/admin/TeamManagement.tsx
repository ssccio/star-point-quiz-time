import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';

interface TeamData {
  count: number;
  connected: number;
  names: string[];
}

interface TeamManagementProps {
  players: Record<string, TeamData>;
  scores: Record<string, number>;
  onAdjustScore: (teamId: string, amount: number) => void;
}

export const TeamManagement = ({ players, scores, onAdjustScore }: TeamManagementProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Team Management</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(TEAMS).map(([teamId, team]) => {
          const teamData = players[teamId];
          const teamScore = scores[teamId];
          
          return (
            <Card key={teamId} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: TEAM_COLORS[teamId as keyof typeof TEAM_COLORS] }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-500">{team.heroine}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{teamScore} pts</div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${
                      teamData.connected === teamData.count ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="text-sm text-gray-500">
                      {teamData.connected}/{teamData.count} online
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {teamData.names.map((name, index) => (
                    <Badge 
                      key={index}
                      variant={index < teamData.connected ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {name}
                      {index >= teamData.connected && <AlertTriangle className="w-3 h-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    onClick={() => onAdjustScore(teamId, 10)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    +10
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onAdjustScore(teamId, -10)}
                    variant="destructive"
                  >
                    -10
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onAdjustScore(teamId, 20)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    +20 Bonus
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};