
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Users, Clock, Crown, Copy } from 'lucide-react';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';
import { gameService } from '@/lib/gameService';
import type { Database } from '@/lib/supabase';
import { toast } from 'sonner';

type Player = Database['public']['Tables']['players']['Row'];
type Game = Database['public']['Tables']['games']['Row'];

const Lobby = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get game data from localStorage
  const gameData = JSON.parse(localStorage.getItem('gameData') || '{}');
  
  useEffect(() => {
    const { gameId, playerId } = gameData;
    
    if (!gameId || !playerId) {
      navigate('/');
      return;
    }

    loadGameData();
    setupRealTimeSubscriptions();
    
    return () => {
      // Cleanup subscriptions
    };
  }, [gameData.gameId, gameData.playerId, navigate]);

  const loadGameData = async () => {
    try {
      const [gameResult, playersResult] = await Promise.all([
        gameService.getGame(gameData.gameCode),
        gameService.getPlayers(gameData.gameId)
      ]);

      if (gameResult) {
        setGame(gameResult);
      }
      
      setPlayers(playersResult);
      
      // Find current player
      const player = playersResult.find(p => p.id === gameData.playerId);
      if (player) {
        setCurrentPlayer(player);
      }
      
    } catch (error) {
      console.error('Error loading game data:', error);
      toast.error('Failed to load game data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeSubscriptions = () => {
    // Subscribe to player updates
    const playersSubscription = gameService.subscribeToPlayers(gameData.gameId, (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    // Subscribe to game status updates
    const gameSubscription = gameService.subscribeToGame(gameData.gameId, (updatedGame) => {
      setGame(updatedGame);
      
      // If game starts, navigate to game page
      if (updatedGame.status === 'active') {
        const playerName = currentPlayer?.name || gameData.playerName;
        const team = currentPlayer?.team || gameData.team;
        
        if (playerName && team) {
          navigate('/game', { 
            state: { playerName, team } 
          });
        } else {
          console.error('Missing player data for game navigation', { currentPlayer, gameData });
          navigate('/');
        }
      }
    });
  };

  const startGame = async () => {
    if (!currentPlayer?.is_host || !game) return;
    
    try {
      await gameService.startGame(game.id);
      toast.success('Game started!');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  const copyGameCode = async () => {
    try {
      await navigator.clipboard.writeText(gameData.gameCode);
      toast.success('Game code copied!');
    } catch (error) {
      toast.error('Failed to copy game code');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span>Loading lobby...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentPlayer || !game) {
    navigate('/');
    return null;
  }

  const team = TEAMS[currentPlayer.team as keyof typeof TEAMS];
  const teamPlayers = players.filter(p => p.team === currentPlayer.team);
  const playersByTeam = players.reduce((acc, player) => {
    acc[player.team] = (acc[player.team] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Game Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
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
                <p className="text-xs text-gray-400 mt-1">{currentPlayer.name}</p>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Game Code:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{gameData.gameCode}</code>
                <Button variant="ghost" size="sm" onClick={copyGameCode}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {currentPlayer.is_host && (
                <div className="flex items-center space-x-1 text-amber-600">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Host</span>
                </div>
              )}
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
            <h2 className="text-xl font-semibold text-gray-900">Your Team</h2>
            <div className="flex items-center text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              <span>{teamPlayers.length}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {teamPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: TEAM_COLORS[team.id] }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900">{player.name}</span>
                  {player.id === currentPlayer.id && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                  {player.is_host && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Host
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(player.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* All Teams Overview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {Object.entries(TEAMS).map(([teamId, teamInfo]) => (
              <div key={teamId} className="text-center p-3 rounded-lg bg-gray-50">
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: teamInfo.color }}
                />
                <div className="text-sm font-medium text-gray-900">{teamInfo.name}</div>
                <div className="text-lg font-bold text-gray-700">
                  {playersByTeam[teamId] || 0}
                </div>
                <div className="text-xs text-gray-500">players</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Game Stats */}
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{players.length}</div>
              <div className="text-sm text-gray-500">Total Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">7</div>
              <div className="text-sm text-gray-500">Questions</div>
            </div>
          </div>
        </Card>

        {/* Host Controls */}
        {currentPlayer.is_host ? (
          <div className="space-y-4">
            <Button 
              onClick={startGame}
              className="w-full h-14 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
              disabled={players.length < 2}
            >
              {players.length < 2 ? 'Waiting for more players...' : 'Start Game'}
            </Button>
            
            {players.length < 2 && (
              <div className="text-center text-sm text-amber-600">
                Need at least 2 players to start the game
              </div>
            )}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <div className="space-y-2">
              <div className="text-amber-600 font-medium">Waiting for host to start the game...</div>
              <div className="text-sm text-gray-500">
                The game will begin automatically when the host clicks "Start Game"
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Share the game code with others to join</p>
          <p>Make sure your device stays connected to the internet</p>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
