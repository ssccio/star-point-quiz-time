import { supabase, isSupabaseConfigured, isDevelopmentMode } from "./supabase";
import type { Database } from "./supabase";

class GameServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "GameServiceError";
  }
}

// Helper to ensure Supabase is configured
function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new GameServiceError(
      "Supabase not configured. Please configure environment variables to use multiplayer features.",
      "SUPABASE_NOT_CONFIGURED"
    );
  }
  return supabase;
}

type Game = Database["public"]["Tables"]["games"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type Answer = Database["public"]["Tables"]["answers"]["Row"];

export interface PlayerAnswer {
  player_id: string;
  player_name: string;
  team: string;
  answer: string;
  is_correct: boolean;
  answered_at: string;
}

// Mock data store for development mode
const mockStore = {
  games: new Map<string, Game>(),
  players: new Map<string, Player>(),
  answers: new Map<string, Answer>(),
  gamesByCode: new Map<string, string>(), // gameCode -> gameId mapping
};

// Generate random 3-character game code
function generateGameCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Auto-assign team based on current team counts
async function getNextAvailableTeam(gameId: string): Promise<string> {
  const client = ensureSupabaseConfigured();

  const { data: players } = await client
    .from("players")
    .select("team")
    .eq("game_id", gameId);

  // Count players per team
  const teamCounts = {
    adah: 0,
    ruth: 0,
    esther: 0,
    martha: 0,
    electa: 0,
  };

  players?.forEach((player) => {
    teamCounts[player.team as keyof typeof teamCounts]++;
  });

  // Return team with lowest count
  return Object.entries(teamCounts).reduce((a, b) =>
    teamCounts[a[0] as keyof typeof teamCounts] <=
    teamCounts[b[0] as keyof typeof teamCounts]
      ? a
      : b
  )[0];
}

export { isSupabaseConfigured };

export const gameService = {
  // Host creates a new game
  async createGame(
    hostName: string
  ): Promise<{ game: Game; gameCode: string }> {
    const gameCode = generateGameCode();
    const hostId = crypto.randomUUID();

    if (isDevelopmentMode) {
      // Mock implementation for development
      const gameId = crypto.randomUUID();
      const now = new Date().toISOString();

      const game: Game = {
        id: gameId,
        game_code: gameCode,
        status: "waiting",
        current_question: 0,
        host_id: hostId,
        created_at: now,
        updated_at: now,
      };

      // Store in mock store - no player record for host
      mockStore.games.set(gameId, game);
      mockStore.gamesByCode.set(gameCode, gameId);

      return { game, gameCode };
    }

    // Real Supabase implementation
    const client = ensureSupabaseConfigured();
    const { data: game, error: gameError } = await client
      .from("games")
      .insert({
        game_code: gameCode,
        host_id: hostId,
        status: "waiting",
      })
      .select()
      .single();

    if (gameError) {
      throw new GameServiceError(
        `Failed to create game: ${gameError.message}`,
        gameError.code
      );
    }

    // Don't create a player record for the host - they're the admin, not a player
    return { game, gameCode };
  },

  // Player joins existing game
  async joinGame(
    gameCode: string,
    playerName: string,
    assignedTeam?: string
  ): Promise<{ game: Game; player: Player; isQueued?: boolean }> {
    const client = ensureSupabaseConfigured();

    // Find game by code (allow any status, not just "waiting")
    const { data: game, error: gameError } = await client
      .from("games")
      .select()
      .eq("game_code", gameCode)
      .single();

    if (gameError || !game) {
      throw new GameServiceError("Game not found", "GAME_NOT_FOUND", 404);
    }

    // Check if game has finished
    if (game.status === "finished") {
      throw new GameServiceError("Game has finished", "GAME_FINISHED", 410);
    }

    // Check if player already exists for this game (prevent duplicates)
    const { data: existingPlayer } = await client
      .from("players")
      .select()
      .eq("game_id", game.id)
      .eq("name", playerName)
      .single();

    if (existingPlayer) {
      // Player already exists, return existing player for reconnection
      const isQueued = game.status !== "waiting" && !existingPlayer.is_active;

      // Provide helpful feedback about reconnection
      console.log(
        `Player ${playerName} reconnecting to game ${game.id}. Status: ${game.status}, Queued: ${isQueued}`
      );

      return { game, player: existingPlayer, isQueued };
    }

    // Use assigned team or auto-assign
    const team = assignedTeam || (await getNextAvailableTeam(game.id));

    // Determine if player should be queued (game is active/paused, not waiting)
    const isQueued = game.status !== "waiting";

    // Create new player with appropriate status
    const { data: player, error: playerError } = await client
      .from("players")
      .insert({
        game_id: game.id,
        name: playerName,
        team: team as "adah" | "ruth" | "esther" | "martha" | "electa",
        is_host: false,
        is_active: !isQueued, // Active if joining before game starts, inactive if queued
      })
      .select()
      .single();

    if (playerError) {
      throw new GameServiceError(
        `Failed to create player: ${playerError.message}`,
        playerError.code
      );
    }

    return { game, player, isQueued };
  },

  // Get game by code
  async getGame(gameCode: string): Promise<Game | null> {
    if (isDevelopmentMode) {
      const gameId = mockStore.gamesByCode.get(gameCode);
      if (!gameId) return null;
      return mockStore.games.get(gameId) || null;
    }

    const client = ensureSupabaseConfigured();
    const { data } = await client
      .from("games")
      .select()
      .eq("game_code", gameCode)
      .single();

    return data;
  },

  // Get all available games (for admin panel)
  async getAllGames(): Promise<Game[]> {
    if (isDevelopmentMode) {
      return Array.from(mockStore.games.values()).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    const client = ensureSupabaseConfigured();
    const { data } = await client
      .from("games")
      .select()
      .order("created_at", { ascending: false })
      .limit(50); // Limit to recent games

    return data || [];
  },

  // Get all players in game
  async getPlayers(gameId: string): Promise<Player[]> {
    if (isDevelopmentMode) {
      return Array.from(mockStore.players.values())
        .filter((player) => player.game_id === gameId)
        .sort(
          (a, b) =>
            new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        );
    }

    const client = ensureSupabaseConfigured();
    const { data } = await client
      .from("players")
      .select()
      .eq("game_id", gameId)
      .order("joined_at");

    return data || [];
  },

  // Subscribe to player updates
  subscribeToPlayers(gameId: string, callback: (players: Player[]) => void) {
    // Try to use real Supabase if available, even in development mode
    if (isDevelopmentMode && !isSupabaseConfigured()) {
      // Only use mock if Supabase is truly not configured
      console.log("Using mock player subscription - Supabase not configured");
      return {
        unsubscribe: () => Promise.resolve({ error: null }),
      };
    }

    const client = ensureSupabaseConfigured();
    console.log("Setting up REAL player subscription for gameId:", gameId);
    return client
      .channel(`players:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Refetch players when changes occur
          this.getPlayers(gameId).then(callback);
        }
      )
      .subscribe();
  },

  // Start game (host only)
  async startGame(gameId: string): Promise<void> {
    if (isDevelopmentMode) {
      // Mock implementation for development
      const game = mockStore.games.get(gameId);
      if (!game) {
        throw new GameServiceError("Game not found", "GAME_NOT_FOUND", 404);
      }

      // Update game status in mock store
      const updatedGame = {
        ...game,
        status: "active" as const,
        current_question: 1,
      };
      mockStore.games.set(gameId, updatedGame);
      return;
    }

    const client = ensureSupabaseConfigured();

    const { error } = await client
      .from("games")
      .update({ status: "active", current_question: 1 })
      .eq("id", gameId);

    if (error) throw error;
  },

  // Submit answer
  async submitAnswer(
    gameId: string,
    playerId: string,
    questionId: number,
    answer: string,
    isCorrect: boolean
  ): Promise<void> {
    const client = ensureSupabaseConfigured();

    const { error } = await client.from("answers").insert({
      game_id: gameId,
      player_id: playerId,
      question_id: questionId,
      answer,
      is_correct: isCorrect,
    });

    if (error) throw error;

    // Update player score if correct
    if (isCorrect) {
      const { data: player } = await client
        .from("players")
        .select("score")
        .eq("id", playerId)
        .single();

      if (player) {
        const newScore = (player.score || 0) + 20;
        console.log(
          `Updating player ${playerId} score from ${player.score} to ${newScore}`
        );

        const { error: scoreError } = await client
          .from("players")
          .update({ score: newScore })
          .eq("id", playerId);

        if (scoreError) {
          console.error("Score update error:", scoreError);
          throw scoreError;
        }
      }
    }
  },

  // Subscribe to game updates
  subscribeToGame(gameId: string, callback: (game: Game) => void) {
    // Try to use real Supabase if available, even in development mode
    if (isDevelopmentMode && !isSupabaseConfigured()) {
      // Only use mock if Supabase is truly not configured
      console.log("Using mock subscription - Supabase not configured");
      return {
        unsubscribe: () => Promise.resolve({ error: null }),
      };
    }

    const client = ensureSupabaseConfigured();
    console.log("Setting up REAL game subscription for gameId:", gameId);

    const channel = client
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log("Game update received:", payload);
          callback(payload.new as Game);
        }
      )
      .subscribe((status) => {
        console.log("Game subscription status:", status);
      });

    return channel;
  },

  // Delete game and all associated data (admin only)
  async deleteGame(gameId: string): Promise<void> {
    if (isDevelopmentMode) {
      // Mock implementation - remove from mock store
      const game = mockStore.games.get(gameId);
      if (game) {
        mockStore.games.delete(gameId);
        mockStore.gamesByCode.delete(game.game_code);
        // Remove associated players and answers
        Array.from(mockStore.players.keys()).forEach((playerId) => {
          const player = mockStore.players.get(playerId);
          if (player?.game_id === gameId) {
            mockStore.players.delete(playerId);
          }
        });
        Array.from(mockStore.answers.keys()).forEach((answerId) => {
          const answer = mockStore.answers.get(answerId);
          if (answer?.game_id === gameId) {
            mockStore.answers.delete(answerId);
          }
        });
      }
      return;
    }

    const client = ensureSupabaseConfigured();

    // Delete in order: answers -> players -> game (due to foreign key constraints)
    await client.from("answers").delete().eq("game_id", gameId);
    await client.from("players").delete().eq("game_id", gameId);

    const { error } = await client.from("games").delete().eq("id", gameId);
    if (error) {
      throw new GameServiceError(
        `Failed to delete game: ${error.message}`,
        error.code
      );
    }
  },

  // Get game statistics for management
  async getGameStats(gameId: string): Promise<{
    playerCount: number;
    status: string;
    createdAt: string;
    lastActivity?: string;
  }> {
    if (isDevelopmentMode) {
      const game = mockStore.games.get(gameId);
      const players = Array.from(mockStore.players.values()).filter(
        (p) => p.game_id === gameId
      );
      return {
        playerCount: players.length,
        status: game?.status || "unknown",
        createdAt: game?.created_at || new Date().toISOString(),
        lastActivity: game?.updated_at,
      };
    }

    const client = ensureSupabaseConfigured();

    const [gameResult, playersResult] = await Promise.all([
      client
        .from("games")
        .select("status, created_at, updated_at")
        .eq("id", gameId)
        .single(),
      client.from("players").select("id").eq("game_id", gameId),
    ]);

    return {
      playerCount: playersResult.data?.length || 0,
      status: gameResult.data?.status || "unknown",
      createdAt: gameResult.data?.created_at || new Date().toISOString(),
      lastActivity: gameResult.data?.updated_at,
    };
  },

  // Get answers for current question (admin view)
  async getQuestionAnswers(
    gameId: string,
    questionNumber: number
  ): Promise<
    Array<{
      player_id: string;
      player_name: string;
      team: string;
      answer: string;
      is_correct: boolean;
      answered_at: string;
    }>
  > {
    if (isDevelopmentMode) {
      // Mock implementation - return empty for now
      return [];
    }

    const client = ensureSupabaseConfigured();

    console.log("GameService: Querying answers for:", {
      gameId,
      questionNumber,
    });

    const { data, error } = await client
      .from("answers")
      .select(
        `
        player_id,
        answer,
        is_correct,
        submitted_at,
        question_id,
        players!inner (
          name,
          team
        )
      `
      )
      .eq("game_id", gameId)
      .eq("question_id", questionNumber)
      .order("submitted_at");

    console.log("GameService: Query result:", {
      data,
      error,
      queryParams: { gameId, questionNumber },
    });

    if (error) {
      console.error("GameService: Query error:", error);
      return [];
    }

    return (
      data?.map((answer) => ({
        player_id: answer.player_id,
        player_name: answer.players.name,
        team: answer.players.team,
        answer: answer.answer,
        is_correct: answer.is_correct,
        answered_at: answer.submitted_at,
      })) || []
    );
  },

  // Subscribe to answer updates for admin
  subscribeToAnswers(
    gameId: string,
    questionNumber: number,
    callback: (answers: PlayerAnswer[]) => void
  ) {
    // Try to use real Supabase if available, even in development mode
    if (isDevelopmentMode && !isSupabaseConfigured()) {
      // Only use mock if Supabase is truly not configured
      console.log("Using mock answer subscription - Supabase not configured");
      return {
        unsubscribe: () => Promise.resolve({ error: null }),
      };
    }

    const client = ensureSupabaseConfigured();
    console.log(
      "Setting up REAL answer subscription for gameId:",
      gameId,
      "question:",
      questionNumber
    );
    return client
      .channel(`answers:${gameId}:${questionNumber}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Refetch answers when changes occur
          this.getQuestionAnswers(gameId, questionNumber).then(callback);
        }
      )
      .subscribe();
  },

  // Advance to next question (admin only)
  async nextQuestion(gameId: string): Promise<void> {
    console.log("🔄 nextQuestion called for gameId:", gameId);
    console.trace("Call stack for nextQuestion:");

    // Use mock only if Supabase is truly not configured
    if (isDevelopmentMode && !isSupabaseConfigured()) {
      console.log("Using mock nextQuestion - Supabase not configured");
      const game = mockStore.games.get(gameId);
      if (!game) {
        throw new GameServiceError("Game not found", "GAME_NOT_FOUND", 404);
      }

      console.log(
        "📈 Advancing question from",
        game.current_question,
        "to",
        (game.current_question || 0) + 1
      );
      const updatedGame = {
        ...game,
        current_question: (game.current_question || 0) + 1,
      };
      mockStore.games.set(gameId, updatedGame);
      return;
    }

    const client = ensureSupabaseConfigured();
    console.log("Using REAL nextQuestion with Supabase");

    // Get current question number first
    const { data: game } = await client
      .from("games")
      .select("current_question")
      .eq("id", gameId)
      .single();

    if (!game) {
      throw new GameServiceError("Game not found", "GAME_NOT_FOUND", 404);
    }

    const nextQuestionNumber = (game.current_question || 0) + 1;
    console.log(
      "📈 Advancing question from",
      game.current_question,
      "to",
      nextQuestionNumber
    );

    const { error } = await client
      .from("games")
      .update({ current_question: nextQuestionNumber })
      .eq("id", gameId);

    if (error) {
      throw new GameServiceError(
        `Failed to advance question: ${error.message}`,
        error.code
      );
    }
  },

  // End game (admin only)
  async endGame(gameId: string): Promise<void> {
    if (isDevelopmentMode) {
      const game = mockStore.games.get(gameId);
      if (!game) {
        throw new GameServiceError("Game not found", "GAME_NOT_FOUND", 404);
      }

      const updatedGame = { ...game, status: "finished" as const };
      mockStore.games.set(gameId, updatedGame);
      return;
    }

    const client = ensureSupabaseConfigured();

    const { error } = await client
      .from("games")
      .update({ status: "finished" })
      .eq("id", gameId);

    if (error) {
      throw new GameServiceError(
        `Failed to end game: ${error.message}`,
        error.code
      );
    }

    // Activate any queued players for the next game
    await this.activateQueuedPlayers(gameId);
  },

  // Pause/Resume game (admin only)
  async pauseGame(gameId: string): Promise<void> {
    if (isDevelopmentMode) {
      const game = mockStore.games.get(gameId);
      if (!game) {
        throw new GameServiceError("Game not found", "GAME_NOT_FOUND", 404);
      }

      const updatedGame = { ...game, status: "paused" as const };
      mockStore.games.set(gameId, updatedGame);
      return;
    }

    const client = ensureSupabaseConfigured();

    const { error } = await client
      .from("games")
      .update({ status: "paused" })
      .eq("id", gameId);

    if (error) {
      throw new GameServiceError(
        `Failed to pause game: ${error.message}`,
        error.code
      );
    }
  },

  async resumeGame(gameId: string): Promise<void> {
    if (isDevelopmentMode) {
      const game = mockStore.games.get(gameId);
      if (!game) {
        throw new GameServiceError("Game not found", "GAME_NOT_FOUND", 404);
      }

      const updatedGame = { ...game, status: "active" as const };
      mockStore.games.set(gameId, updatedGame);
      return;
    }

    const client = ensureSupabaseConfigured();

    const { error } = await client
      .from("games")
      .update({ status: "active" })
      .eq("id", gameId);

    if (error) {
      throw new GameServiceError(
        `Failed to resume game: ${error.message}`,
        error.code
      );
    }
  },

  // Activate queued players (when game ends)
  async activateQueuedPlayers(gameId: string): Promise<void> {
    if (isDevelopmentMode) {
      // Mock implementation - activate all inactive players
      Array.from(mockStore.players.values()).forEach((player) => {
        if (player.game_id === gameId && !player.is_active) {
          const updatedPlayer = { ...player, is_active: true };
          mockStore.players.set(player.id, updatedPlayer);
        }
      });
      return;
    }

    const client = ensureSupabaseConfigured();

    // Activate all inactive players for this game
    const { error } = await client
      .from("players")
      .update({ is_active: true })
      .eq("game_id", gameId)
      .eq("is_active", false);

    if (error) {
      console.error("Failed to activate queued players:", error);
    }
  },

  // Get queued players count
  async getQueuedPlayersCount(gameId: string): Promise<number> {
    if (isDevelopmentMode) {
      return Array.from(mockStore.players.values()).filter(
        (player) => player.game_id === gameId && !player.is_active
      ).length;
    }

    const client = ensureSupabaseConfigured();
    const { data } = await client
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .eq("is_active", false);

    return data?.length || 0;
  },
};
