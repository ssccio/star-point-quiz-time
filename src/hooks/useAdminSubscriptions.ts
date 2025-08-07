import { useCallback } from 'react';
import { gameService } from '@/lib/gameService';
import { useSupabaseSubscription } from './useSupabaseSubscription';

interface Player {
  id: string;
  game_id: string;
  name: string;
  team: 'adah' | 'ruth' | 'esther' | 'martha' | 'electa';
  score: number;
  is_host: boolean;
  is_active: boolean;
  joined_at: string;
  last_active_at: string;
}

interface Game {
  id: string;
  game_code: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  current_question: number;
  host_id: string;
  created_at: string;
  updated_at: string;
}

interface UseAdminSubscriptionsOptions {
  gameId?: string;
  onPlayersUpdate: (players: Player[]) => void;
  onGameUpdate: (game: Game) => void;
  onReconnected?: () => void;
  debugLabel?: string;
}

export const useAdminSubscriptions = ({
  gameId,
  onPlayersUpdate,
  onGameUpdate,
  onReconnected,
  debugLabel = 'Admin'
}: UseAdminSubscriptionsOptions) => {

  const refreshData = useCallback(async () => {
    if (!gameId) return;
    
    try {
      console.log(`${debugLabel}: Refreshing data after reconnection`);
      const [players, game] = await Promise.all([
        gameService.getPlayers(gameId),
        gameService.getGame(gameId)
      ]);
      
      onPlayersUpdate(players);
      if (game) {
        onGameUpdate(game);
      }
      onReconnected?.();
    } catch (error) {
      console.error(`${debugLabel}: Failed to refresh data:`, error);
    }
  }, [gameId, onPlayersUpdate, onGameUpdate, onReconnected, debugLabel]);

  // Set up robust player subscription with reconnection
  const playersSubscription = useSupabaseSubscription(
    () => {
      if (!gameId) return null;
      return gameService.subscribeToPlayers(gameId, onPlayersUpdate);
    },
    [gameId],
    {
      debugLabel: `${debugLabel}-Players`,
      enableToasts: false,
      onReconnected: refreshData
    }
  );

  // Set up robust game subscription with reconnection  
  const gameSubscription = useSupabaseSubscription(
    () => {
      if (!gameId) return null;
      return gameService.subscribeToGame(gameId, onGameUpdate);
    },
    [gameId],
    {
      debugLabel: `${debugLabel}-Game`,
      enableToasts: false,
      onReconnected: refreshData
    }
  );

  return {
    playersSubscription,
    gameSubscription,
    refreshData,
    isPlayersActive: playersSubscription.isActive,
    isGameActive: gameSubscription.isActive,
  };
};