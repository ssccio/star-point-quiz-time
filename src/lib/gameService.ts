import { supabase, isSupabaseConfigured } from './supabase'
import type { Database } from './supabase'

class GameServiceError extends Error {
  constructor(message: string, public code?: string, public statusCode?: number) {
    super(message);
    this.name = 'GameServiceError';
  }
}

// Helper to ensure Supabase is configured
function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new GameServiceError('Supabase not configured. Please configure environment variables to use multiplayer features.', 'SUPABASE_NOT_CONFIGURED');
  }
  return supabase;
}

type Game = Database['public']['Tables']['games']['Row']
type Player = Database['public']['Tables']['players']['Row']
type Answer = Database['public']['Tables']['answers']['Row']

// Generate random 6-character game code
function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Auto-assign team based on current team counts
async function getNextAvailableTeam(gameId: string): Promise<string> {
  const client = ensureSupabaseConfigured();
  
  const { data: players } = await client
    .from('players')
    .select('team')
    .eq('game_id', gameId)

  // Count players per team
  const teamCounts = {
    adah: 0,
    ruth: 0,
    esther: 0,
    martha: 0,
    electa: 0
  }

  players?.forEach(player => {
    teamCounts[player.team as keyof typeof teamCounts]++
  })

  // Return team with lowest count
  return Object.entries(teamCounts).reduce((a, b) => 
    teamCounts[a[0] as keyof typeof teamCounts] <= teamCounts[b[0] as keyof typeof teamCounts] ? a : b
  )[0]
}

export { isSupabaseConfigured };

export const gameService = {
  // Host creates a new game
  async createGame(hostName: string): Promise<{ game: Game; player: Player; gameCode: string }> {
    const client = ensureSupabaseConfigured();

    const gameCode = generateGameCode()
    const hostId = crypto.randomUUID()

    // Create game
    const { data: game, error: gameError } = await client
      .from('games')
      .insert({
        game_code: gameCode,
        host_id: hostId,
        status: 'waiting'
      })
      .select()
      .single()

    if (gameError) {
      throw new GameServiceError(`Failed to create game: ${gameError.message}`, gameError.code);
    }

    // Create host player
    const { data: player, error: playerError } = await client
      .from('players')
      .insert({
        game_id: game.id,
        name: hostName,
        team: 'adah', // Host gets first team
        is_host: true
      })
      .select()
      .single()

    if (playerError) {
      throw new GameServiceError(`Failed to create player: ${playerError.message}`, playerError.code);
    }

    return { game, player, gameCode }
  },

  // Player joins existing game
  async joinGame(gameCode: string, playerName: string, assignedTeam?: string): Promise<{ game: Game; player: Player }> {
    const client = ensureSupabaseConfigured();
    
    // Find game by code
    const { data: game, error: gameError } = await client
      .from('games')
      .select()
      .eq('game_code', gameCode)
      .eq('status', 'waiting')
      .single()

    if (gameError || !game) {
      throw new GameServiceError('Game not found or already started', 'GAME_NOT_FOUND', 404);
    }

    // Use assigned team or auto-assign
    const team = assignedTeam || await getNextAvailableTeam(game.id)

    // Create player
    const { data: player, error: playerError } = await client
      .from('players')
      .insert({
        game_id: game.id,
        name: playerName,
        team: team as any,
        is_host: false
      })
      .select()
      .single()

    if (playerError) {
      throw new GameServiceError(`Failed to create player: ${playerError.message}`, playerError.code);
    }

    return { game, player }
  },

  // Get game by code
  async getGame(gameCode: string): Promise<Game | null> {
    const client = ensureSupabaseConfigured();
    
    const { data } = await client
      .from('games')
      .select()
      .eq('game_code', gameCode)
      .single()

    return data
  },

  // Get all players in game
  async getPlayers(gameId: string): Promise<Player[]> {
    const client = ensureSupabaseConfigured();
    
    const { data } = await client
      .from('players')
      .select()
      .eq('game_id', gameId)
      .order('joined_at')

    return data || []
  },

  // Subscribe to player updates
  subscribeToPlayers(gameId: string, callback: (players: Player[]) => void) {
    const client = ensureSupabaseConfigured();
    
    return client
      .channel(`players:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        () => {
          // Refetch players when changes occur
          this.getPlayers(gameId).then(callback)
        }
      )
      .subscribe()
  },

  // Start game (host only)
  async startGame(gameId: string): Promise<void> {
    const client = ensureSupabaseConfigured();
    
    const { error } = await client
      .from('games')
      .update({ status: 'active', current_question: 1 })
      .eq('id', gameId)

    if (error) throw error
  },

  // Submit answer
  async submitAnswer(gameId: string, playerId: string, questionId: number, answer: string, isCorrect: boolean): Promise<void> {
    const client = ensureSupabaseConfigured();
    
    const { error } = await client
      .from('answers')
      .insert({
        game_id: gameId,
        player_id: playerId,
        question_id: questionId,
        answer,
        is_correct: isCorrect
      })

    if (error) throw error

    // Update player score if correct
    if (isCorrect) {
      const { data: player } = await client
        .from('players')
        .select('score')
        .eq('id', playerId)
        .single()

      if (player) {
        const { error: scoreError } = await client
          .from('players')
          .update({ score: player.score + 20 })
          .eq('id', playerId)

        if (scoreError) throw scoreError
      }
    }
  },

  // Subscribe to game updates
  subscribeToGame(gameId: string, callback: (game: Game) => void) {
    const client = ensureSupabaseConfigured();
    
    return client
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          callback(payload.new as Game)
        }
      )
      .subscribe()
  }
}