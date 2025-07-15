import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Monitor } from 'lucide-react';
import { sampleQuestions } from '@/utils/sampleData';
import { DEMO_TEAM_DATA, DEMO_SCORES, APP_CONFIG } from '@/utils/config';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { GameControls } from '@/components/admin/GameControls';
import { GameStatus } from '@/components/admin/GameStatus';
import { TeamManagement } from '@/components/admin/TeamManagement';
import { QuestionDisplay } from '@/components/admin/QuestionDisplay';

type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(60);
  const [players, setPlayers] = useState(
    APP_CONFIG.USE_DEMO_DATA ? DEMO_TEAM_DATA : {
      adah: { count: 0, connected: 0, names: [] },
      ruth: { count: 0, connected: 0, names: [] },
      esther: { count: 0, connected: 0, names: [] },
      martha: { count: 0, connected: 0, names: [] },
      electa: { count: 0, connected: 0, names: [] }
    }
  );
  const [scores, setScores] = useState(
    APP_CONFIG.USE_DEMO_DATA ? DEMO_SCORES : {
      adah: 0,
      ruth: 0,
      esther: 0,
      martha: 0,
      electa: 0
    }
  );

  const handleLogin = (password: string) => {
    if (password === APP_CONFIG.DEFAULT_ADMIN_PASSWORD) {
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
    return <AdminLogin onLogin={handleLogin} />;
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
        <GameControls
          gameStatus={gameStatus}
          onStartGame={handleStartGame}
          onPauseGame={handlePauseGame}
          onStopGame={handleStopGame}
          onNextQuestion={handleNextQuestion}
        />

        {/* Current Status */}
        <GameStatus
          totalConnected={totalConnected}
          totalPlayers={totalPlayers}
          timerRemaining={timerRemaining}
          currentQuestion={currentQuestion}
          totalQuestions={sampleQuestions.length}
        />

        {/* Team Management */}
        <TeamManagement
          players={players}
          scores={scores}
          onAdjustScore={adjustScore}
        />

        {/* Current Question Display */}
        <QuestionDisplay
          currentQuestion={currentQuestion}
          question={sampleQuestions[currentQuestion]}
        />
      </div>
    </div>
  );
};

export default Admin;