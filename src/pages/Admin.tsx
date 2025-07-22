import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Monitor, AlertTriangle, QrCode, Printer } from 'lucide-react';
import { sampleQuestions } from '@/utils/sampleData';
import { APP_CONFIG } from '@/utils/config';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { GameControls } from '@/components/admin/GameControls';
import { GameStatus } from '@/components/admin/GameStatus';
import { TeamManagement } from '@/components/admin/TeamManagement';
import { QuestionDisplay } from '@/components/admin/QuestionDisplay';
import { gameService } from '@/lib/gameService';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Game = Database['public']['Tables']['games']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type GameStatus = 'waiting' | 'active' | 'paused' | 'finished';

interface TeamData {
  count: number;
  connected: number;
  names: string[];
  scores: number;
}

interface AdminState {
  selectedGame: Game | null;
  players: Player[];
  teamData: Record<string, TeamData>;
  loading: boolean;
  error: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [adminState, setAdminState] = useState<AdminState>({
    selectedGame: null,
    players: [],
    teamData: {
      adah: { count: 0, connected: 0, names: [], scores: 0 },
      ruth: { count: 0, connected: 0, names: [], scores: 0 },
      esther: { count: 0, connected: 0, names: [], scores: 0 },
      martha: { count: 0, connected: 0, names: [], scores: 0 },
      electa: { count: 0, connected: 0, names: [], scores: 0 }
    },
    loading: false,
    error: null
  });

  // Secure authentication with proper validation
  const handleLogin = async (password: string) => {
    if (!password || password.length < 6) {
      setAdminState(prev => ({ ...prev, error: 'Password must be at least 6 characters' }));
      return;
    }
    
    if (password === APP_CONFIG.DEFAULT_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
        expires: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
      };
      localStorage.setItem('adminAuth', JSON.stringify(authData));
    } else {
      setAdminState(prev => ({ ...prev, error: 'Invalid password' }));
    }
  };

  // Validate stored authentication
  useEffect(() => {
    try {
      const authStr = localStorage.getItem('adminAuth');
      if (authStr) {
        const auth = JSON.parse(authStr);
        if (auth.authenticated && auth.expires > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminAuth');
        }
      }
    } catch (error) {
      localStorage.removeItem('adminAuth');
    }
  }, []);

  const loadGameData = useCallback(async () => {
    setAdminState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const game = await gameService.getGame(gameCode);
      if (!game) {
        setAdminState(prev => ({ ...prev, error: 'Game not found', loading: false }));
        return;
      }

      const players = await gameService.getPlayers(game.id);
      const teamData = calculateTeamData(players);

      setAdminState(prev => ({
        ...prev,
        selectedGame: game,
        players,
        teamData,
        loading: false
      }));

      // Subscribe to real-time updates
      const playerSubscription = gameService.subscribeToPlayers(game.id, (updatedPlayers) => {
        const newTeamData = calculateTeamData(updatedPlayers);
        setAdminState(prev => ({
          ...prev,
          players: updatedPlayers,
          teamData: newTeamData
        }));
      });

      const gameSubscription = gameService.subscribeToGame(game.id, (updatedGame) => {
        setAdminState(prev => ({
          ...prev,
          selectedGame: updatedGame
        }));
      });

      return () => {
        supabase.removeChannel(playerSubscription);
        supabase.removeChannel(gameSubscription);
      };
    } catch (error) {
      setAdminState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load game data',
        loading: false 
      }));
    }
  }, [gameCode]);

  // Load game data when game code is set
  useEffect(() => {
    if (gameCode && isAuthenticated) {
      loadGameData();
    }
  }, [gameCode, isAuthenticated, loadGameData]);

  const calculateTeamData = (players: Player[]): Record<string, TeamData> => {
    const teams = ['adah', 'ruth', 'esther', 'martha', 'electa'];
    const teamData: Record<string, TeamData> = {};

    teams.forEach(team => {
      const teamPlayers = players.filter(p => p.team === team);
      teamData[team] = {
        count: teamPlayers.length,
        connected: teamPlayers.length, // All loaded players are considered connected
        names: teamPlayers.map(p => p.name),
        scores: teamPlayers.reduce((sum, p) => sum + (p.score || 0), 0)
      };
    });

    return teamData;
  };

  const handleStartGame = async () => {
    if (!adminState.selectedGame) return;
    
    try {
      await gameService.startGame(adminState.selectedGame.id);
      setAdminState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setAdminState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start game' 
      }));
    }
  };

  // Note: Pause/Stop functionality would need additional backend support
  const handlePauseGame = () => {
    setAdminState(prev => ({ ...prev, error: 'Pause functionality not yet implemented' }));
  };
  
  const handleStopGame = () => {
    setAdminState(prev => ({ ...prev, error: 'Stop functionality not yet implemented' }));
  };

  const handleNextQuestion = () => {
    setAdminState(prev => ({ ...prev, error: 'Next question functionality not yet implemented' }));
  };

  const adjustScore = () => {
    setAdminState(prev => ({ ...prev, error: 'Manual score adjustment not yet implemented' }));
  };

  const totalPlayers = adminState.players.length;
  const totalConnected = adminState.players.length;

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} error={adminState.error} />;
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
          <div className="flex items-center space-x-4">
            {adminState.selectedGame && (
              <Badge variant={adminState.selectedGame.status === 'active' ? 'default' : 'outline'}>
                {adminState.selectedGame.status.toUpperCase()}
              </Badge>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('adminAuth');
                setIsAuthenticated(false);
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>

        {/* QR Code Generation Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <QrCode className="w-6 h-6 text-indigo-600" />
            <span>Table QR Codes</span>
          </h2>
          <p className="text-gray-600 mb-4">
            Generate printable QR codes for each team table. Print these at home before the event.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/admin/qr-codes')}
              className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Printer className="w-4 h-4" />
              <span>Generate All Team QR Codes</span>
            </button>
            <button
              onClick={() => {
                const baseUrl = prompt('Enter base URL (leave empty for current):', window.location.origin) || window.location.origin;
                navigate(`/admin/qr-codes?baseUrl=${encodeURIComponent(baseUrl)}`);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Custom Domain
            </button>
          </div>
        </div>

        {/* Game Code Input */}
        {!adminState.selectedGame && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Connect to Game</h2>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Enter game code (e.g., ABC)"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                maxLength={3}
              />
              <button
                onClick={loadGameData}
                disabled={!gameCode || adminState.loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminState.loading ? 'Loading...' : 'Connect'}
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {adminState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{adminState.error}</span>
            <button
              onClick={() => setAdminState(prev => ({ ...prev, error: null }))}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Game Controls - Only show when game is connected */}
        {adminState.selectedGame && (
          <GameControls
            gameStatus={adminState.selectedGame.status as GameStatus}
            onStartGame={handleStartGame}
            onPauseGame={handlePauseGame}
            onStopGame={handleStopGame}
            onNextQuestion={handleNextQuestion}
          />
        )}

        {/* Current Status - Only show when game is connected */}
        {adminState.selectedGame && (
          <GameStatus
            totalConnected={totalConnected}
            totalPlayers={totalPlayers}
            timerRemaining={60} // TODO: Implement real timer
            currentQuestion={adminState.selectedGame.current_question || 0}
            totalQuestions={sampleQuestions.length}
          />
        )}

        {/* Team Management - Only show when game is connected */}
        {adminState.selectedGame && (
          <TeamManagement
            players={adminState.teamData}
            scores={Object.fromEntries(
              Object.entries(adminState.teamData).map(([team, data]) => [team, data.scores])
            )}
            onAdjustScore={adjustScore}
          />
        )}

        {/* Current Question Display - Only show when game is connected */}
        {adminState.selectedGame && adminState.selectedGame.current_question && (
          <QuestionDisplay
            currentQuestion={adminState.selectedGame.current_question - 1}
            question={sampleQuestions[adminState.selectedGame.current_question - 1]}
          />
        )}

        {/* Game Info Display */}
        {adminState.selectedGame && (
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold mb-2">Game Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Game Code:</span> {adminState.selectedGame.game_code}
              </div>
              <div>
                <span className="font-medium">Status:</span> {adminState.selectedGame.status}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(adminState.selectedGame.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Current Question:</span> {adminState.selectedGame.current_question || 'Not started'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;