import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Users, 
  Clock, 
  Trophy,
  Settings,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';
import { sampleQuestions } from '@/utils/sampleData';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'paused' | 'finished'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(60);
  const [players, setPlayers] = useState({
    adah: { count: 4, connected: 3, names: ['Alice M.', 'Bob K.', 'Carol R.', 'Dave S.'] },
    ruth: { count: 3, connected: 3, names: ['Eve T.', 'Frank L.', 'Grace W.'] },
    esther: { count: 5, connected: 4, names: ['Henry P.', 'Iris J.', 'Jack M.', 'Kate N.', 'Liam O.'] },
    martha: { count: 3, connected: 2, names: ['Maya Q.', 'Nick R.', 'Olivia S.'] },
    electa: { count: 4, connected: 4, names: ['Paul T.', 'Quinn U.', 'Rose V.', 'Sam W.'] }
  });
  const [scores, setScores] = useState({
    adah: 150,
    ruth: 180,
    esther: 120,
    martha: 160,
    electa: 140
  });

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleStartGame = () => setGameStatus('playing');
  const handlePauseGame = () => setGameStatus('paused');
  const handleStopGame = () => setGameStatus('waiting');
  const handleNextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimerRemaining(60);
    }
  };

  const adjustScore = (teamId: string, amount: number) => {
    setScores(prev => ({
      ...prev,
      [teamId]: Math.max(0, prev[teamId as keyof typeof prev] + amount)
    }));
  };

  const totalPlayers = Object.values(players).reduce((sum, team) => sum + team.count, 0);
  const totalConnected = Object.values(players).reduce((sum, team) => sum + team.connected, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-4">
            <Settings className="w-16 h-16 text-indigo-600 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Enter admin password to continue</p>
          </div>
          
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="h-12 text-lg"
            />
            <Button 
              onClick={handleLogin}
              className="w-full min-h-[60px] text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
            >
              Access Admin Panel
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>Demo password: admin123</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Game Control Dashboard</h1>
          </div>
          <Badge variant={gameStatus === 'playing' ? 'default' : gameStatus === 'paused' ? 'secondary' : 'outline'}>
            {gameStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Game Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Game Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={handleStartGame}
              disabled={gameStatus === 'playing'}
              className="min-h-[60px] bg-green-600 hover:bg-green-700"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
            <Button 
              onClick={handlePauseGame}
              disabled={gameStatus !== 'playing'}
              className="min-h-[60px] bg-yellow-600 hover:bg-yellow-700"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
            <Button 
              onClick={handleStopGame}
              variant="destructive"
              className="min-h-[60px]"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Game
            </Button>
            <Button 
              onClick={handleNextQuestion}
              disabled={gameStatus !== 'playing'}
              className="min-h-[60px] bg-blue-600 hover:bg-blue-700"
            >
              <SkipForward className="w-5 h-5 mr-2" />
              Next Question
            </Button>
          </div>
        </Card>

        {/* Current Status */}
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
                <div className="text-2xl font-bold text-gray-900">{currentQuestion + 1}/{sampleQuestions.length}</div>
                <div className="text-sm text-gray-500">Current Question</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Team Management */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Team Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(TEAMS).map(([teamId, team]) => {
              const teamData = players[teamId as keyof typeof players];
              const teamScore = scores[teamId as keyof typeof scores];
              
              return (
                <Card key={teamId} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: TEAM_COLORS[teamId] }}
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
                        onClick={() => adjustScore(teamId, 10)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        +10
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => adjustScore(teamId, -10)}
                        variant="destructive"
                      >
                        -10
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => adjustScore(teamId, 20)}
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

        {/* Current Question Display */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Question</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">Question {currentQuestion + 1}</div>
              <div className="text-lg font-medium text-gray-900">
                {sampleQuestions[currentQuestion]?.text || 'No question loaded'}
              </div>
            </div>
            
            {sampleQuestions[currentQuestion]?.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleQuestions[currentQuestion].options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isCorrect = option === sampleQuestions[currentQuestion].correctAnswer;
                  
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${
                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="font-bold mr-2">{letter}.</span>
                      <span>{option}</span>
                      {isCorrect && <span className="ml-2 text-green-600 font-bold">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;