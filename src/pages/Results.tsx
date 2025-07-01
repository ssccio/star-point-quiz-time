
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Trophy, Medal, Award } from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);
  
  const { playerName, team: teamId, finalScores } = location.state || {};
  
  useEffect(() => {
    if (!playerName || !teamId || !finalScores) {
      navigate('/');
      return;
    }
    
    // Trigger animation after component mounts
    setTimeout(() => setShowAnimation(true), 500);
  }, [playerName, teamId, finalScores, navigate]);

  if (!finalScores) {
    navigate('/');
    return null;
  }

  // Convert scores to sorted array
  const sortedTeams = Object.entries(finalScores)
    .map(([id, score]) => ({
      ...TEAMS[id],
      score: score as number
    }))
    .sort((a, b) => b.score - a.score);

  const playerTeam = TEAMS[teamId];
  const playerRank = sortedTeams.findIndex(team => team.id === teamId) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <Star className="w-6 h-6 text-gray-400" />;
    }
  };

  const handlePlayAgain = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Game Complete!</h1>
          <p className="text-xl text-gray-600">Final Rankings</p>
        </div>

        {/* Player's Result */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div 
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: TEAM_COLORS[playerTeam.id] }}
            >
              <Star className="w-10 h-10" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team {playerTeam.name}</h2>
              <p className="text-lg text-gray-600">{playerTeam.heroine}</p>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">
                  {finalScores[teamId]}
                </span>
                <span className="text-lg text-gray-500 ml-2">points</span>
              </div>
              <div className="flex items-center justify-center mt-2">
                {getRankIcon(playerRank)}
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {playerRank === 1 ? '1st Place!' : 
                   playerRank === 2 ? '2nd Place!' : 
                   playerRank === 3 ? '3rd Place!' : 
                   `${playerRank}th Place`}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Leaderboard */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Final Leaderboard</h3>
          <div className="space-y-3">
            {sortedTeams.map((team, index) => (
              <div 
                key={team.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-500 ${
                  showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${team.id === teamId ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(index + 1)}
                    <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                  </div>
                  
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: TEAM_COLORS[team.id] }}
                  >
                    <Star className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-500">{team.heroine}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{team.score}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Winner Celebration with Animation */}
        {playerRank === 1 && (
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 relative overflow-hidden">
            <div className="text-center space-y-3 relative z-10">
              <div className="text-6xl animate-bounce">🎉</div>
              <h3 className="text-2xl font-bold text-amber-800">Congratulations!</h3>
              <p className="text-amber-700">Team {playerTeam.name} wins!</p>
              <div className="text-4xl">🏆👑🌟</div>
            </div>
            {/* Animated confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handlePlayAgain}
            className="w-full min-h-[60px] text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 px-6 py-4"
          >
            New Game
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full min-h-[60px] text-lg font-semibold px-6 py-4"
          >
            Return to Lobby
          </Button>
        </div>

        {/* Thank You */}
        <div className="text-center text-gray-500 space-y-2">
          <p className="text-lg">Thank you for playing!</p>
          <p className="text-sm">Eastern Star Trivia Game</p>
        </div>
      </div>
    </div>
  );
};

export default Results;
