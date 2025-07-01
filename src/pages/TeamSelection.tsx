
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Star, Users } from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';

const TeamSelection = () => {
  const navigate = useNavigate();

  const handleTeamSelect = (teamId: string) => {
    navigate(`/?team=${teamId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <Star className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Eastern Star Trivia</h1>
          <p className="text-xl text-gray-600">Choose your star point to begin</p>
        </div>

        {/* Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(TEAMS).map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg p-6 text-center space-y-4 min-h-[120px]"
              onClick={() => handleTeamSelect(team.id)}
            >
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: TEAM_COLORS[team.id] }}
              >
                <Star className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                <p className="text-lg text-gray-600">{team.heroine}</p>
                <div 
                  className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium mt-2"
                  style={{ backgroundColor: TEAM_COLORS[team.id] }}
                >
                  {team.meaning}
                </div>
              </div>

              <div className="flex items-center justify-center text-gray-500 text-sm">
                <Users className="w-4 h-4 mr-1" />
                <span>0 members</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">Scan the QR code at your table to join your team directly</p>
        </div>
      </div>
    </div>
  );
};

export default TeamSelection;
