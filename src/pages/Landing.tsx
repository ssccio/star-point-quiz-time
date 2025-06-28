
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Star, Users } from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';

interface LandingProps {
  preselectedTeam?: string;
}

const Landing = ({ preselectedTeam }: LandingProps) => {
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const team = preselectedTeam ? TEAMS[preselectedTeam] : null;

  const handleJoinGame = async () => {
    if (!playerName.trim() || playerName.length < 2) return;
    
    setIsJoining(true);
    
    // Simulate joining process
    setTimeout(() => {
      navigate('/lobby', { 
        state: { 
          playerName: playerName.trim(), 
          team: preselectedTeam,
          email: email.trim() || undefined 
        } 
      });
    }, 1000);
  };

  if (!team) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Team Header */}
        <div className="text-center space-y-4">
          <div 
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            style={{ backgroundColor: TEAM_COLORS[team.id] }}
          >
            <Star className="w-8 h-8" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-lg text-gray-600">{team.heroine}</p>
            <p className="text-sm text-gray-500 mt-1">Team {team.name}</p>
          </div>
        </div>

        {/* Join Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              First Name & Last Initial *
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John D."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="text-lg h-12"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 2 characters required</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
          </div>

          <Button
            onClick={handleJoinGame}
            disabled={playerName.trim().length < 2 || isJoining}
            className="w-full h-16 text-lg font-semibold"
            style={{ 
              backgroundColor: playerName.trim().length >= 2 ? TEAM_COLORS[team.id] : undefined 
            }}
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining Game...
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Join Game
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>You'll join the {team.name} team</p>
          <p>Get ready for Eastern Star trivia!</p>
        </div>
      </Card>
    </div>
  );
};

export default Landing;
