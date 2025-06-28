
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Users, Clock } from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';

interface TeamMember {
  id: string;
  name: string;
  joinedAt: Date;
}

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  
  const { playerName, team: teamId, email } = location.state || {};
  
  useEffect(() => {
    if (!playerName || !teamId) {
      navigate('/');
      return;
    }

    // Simulate adding current player to team
    const currentPlayer: TeamMember = {
      id: 'current',
      name: playerName,
      joinedAt: new Date()
    };
    
    setTeamMembers([currentPlayer]);
    setTotalPlayers(12); // Simulate total players across all teams

    // Simulate other players joining
    const addPlayer = (name: string) => {
      const newPlayer: TeamMember = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        joinedAt: new Date()
      };
      
      setTeamMembers(prev => [...prev, newPlayer]);
      setTotalPlayers(prev => prev + 1);
    };

    // Add some demo players
    setTimeout(() => addPlayer('Sarah M.'), 2000);
    setTimeout(() => addPlayer('Mike R.'), 4000);
    setTimeout(() => addPlayer('Lisa K.'), 6000);
  }, [playerName, teamId, navigate]);

  const team = TEAMS[teamId];
  
  if (!team) {
    navigate('/');
    return null;
  }

  const handleStartDemo = () => {
    navigate('/game', { 
      state: { 
        playerName, 
        team: teamId, 
        email,
        teamMembers 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Team Header */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: TEAM_COLORS[team.id] }}
            >
              <Star className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Team {team.name}</h1>
              <p className="text-lg text-gray-600">{team.heroine}</p>
              <p className="text-sm text-gray-500">{team.meaning}</p>
            </div>
          </div>
        </Card>

        {/* Game Status */}
        <Card className="p-6 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6 mr-2" />
              <span className="text-lg font-medium">Waiting for game to start...</span>
            </div>
            <p className="text-gray-600">
              Get ready for questions about Rob Morris and Eastern Star history!
            </p>
          </div>
        </Card>

        {/* Team Members */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <div className="flex items-center text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              <span>{teamMembers.length}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: TEAM_COLORS[team.id] }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900">{member.name}</span>
                  {index === 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {member.joinedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Game Stats */}
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalPlayers}</div>
              <div className="text-sm text-gray-500">Total Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">15-20</div>
              <div className="text-sm text-gray-500">Minutes</div>
            </div>
          </div>
        </Card>

        {/* Demo Button */}
        <Button 
          onClick={handleStartDemo}
          className="w-full h-14 text-lg font-semibold"
          style={{ backgroundColor: TEAM_COLORS[team.id] }}
        >
          Start Demo Game
        </Button>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>The game will start automatically when the host begins</p>
          <p>Make sure your device stays connected to the internet</p>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
