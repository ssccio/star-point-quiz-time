import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseSubscription } from "@/hooks/useSupabaseSubscription";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Monitor,
  AlertTriangle,
  QrCode,
  Printer,
  Plus,
  Loader2,
  Crown,
  Trash2,
  Calendar,
  Users,
  ArrowLeft,
  Upload,
  Clock,
} from "lucide-react";
import { sampleQuestions } from "@/utils/sampleData";
import {
  loadDefaultQuestions,
  loadQuestionsFromYAML,
  getAvailableQuestionSets,
} from "@/utils/questionLoader";
import { questionSetService, type QuestionSet } from "@/lib/questionSetService";
import { APP_CONFIG } from "@/utils/config";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { GameControls } from "@/components/admin/GameControls";
import { GameStatus } from "@/components/admin/GameStatus";
import { TeamManagement } from "@/components/admin/TeamManagement";
import { QuestionDisplay } from "@/components/admin/QuestionDisplay";
import { PracticeManagement } from "@/components/admin/PracticeManagement";
import { gameService } from "@/lib/gameService";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase";

type Game = Database["public"]["Tables"]["games"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type GameStatus = "waiting" | "active" | "paused" | "finished";

interface TeamData {
  count: number;
  connected: number;
  names: string[];
  scores: number;
  queuedCount?: number;
  queuedNames?: string[];
}

interface AdminState {
  selectedGame: Game | null;
  players: Player[];
  teamData: Record<string, TeamData>;
  loading: boolean;
  error: string | null;
  availableGames: Game[];
  showGameList: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [hostName, setHostName] = useState("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showCreateGame, setShowCreateGame] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(sampleQuestions.length);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(
    "rob-morris-biography"
  );
  const [loadedQuestions, setLoadedQuestions] = useState(sampleQuestions);
  const [availableQuestionSets, setAvailableQuestionSets] = useState<
    QuestionSet[]
  >([]);
  const [selectedQuestionSetId, setSelectedQuestionSetId] =
    useState<string>("");
  const [adminState, setAdminState] = useState<AdminState>({
    selectedGame: null,
    players: [],
    teamData: {
      adah: { count: 0, connected: 0, names: [], scores: 0 },
      ruth: { count: 0, connected: 0, names: [], scores: 0 },
      esther: { count: 0, connected: 0, names: [], scores: 0 },
      martha: { count: 0, connected: 0, names: [], scores: 0 },
      electa: { count: 0, connected: 0, names: [], scores: 0 },
    },
    loading: false,
    error: null,
    availableGames: [],
    showGameList: false,
  });

  // Set up robust subscriptions for admin panel with phone lock recovery
  const adminSubscriptions = useAdminSubscriptions({
    gameId: adminState.selectedGame?.id,
    onPlayersUpdate: (players) => {
      const teamData = calculateTeamData(players);
      setAdminState((prev) => ({
        ...prev,
        players,
        teamData,
      }));
    },
    onGameUpdate: (game) => {
      setAdminState((prev) => ({
        ...prev,
        selectedGame: game,
      }));
    },
    onReconnected: () => {
      console.log("Admin subscriptions reconnected successfully");
    },
    debugLabel: "Admin",
  });

  // Secure authentication with proper validation
  const handleLogin = async (password: string) => {
    if (!password || password.length < 6) {
      setAdminState((prev) => ({
        ...prev,
        error: "Password must be at least 6 characters",
      }));
      return;
    }

    if (password === APP_CONFIG.DEFAULT_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
        expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      };
      localStorage.setItem("adminAuth", JSON.stringify(authData));
    } else {
      setAdminState((prev) => ({ ...prev, error: "Invalid password" }));
    }
  };

  // Validate stored authentication
  useEffect(() => {
    try {
      const authStr = localStorage.getItem("adminAuth");
      if (authStr) {
        const auth = JSON.parse(authStr);
        if (auth.authenticated && auth.expires > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("adminAuth");
        }
      }
    } catch (error) {
      localStorage.removeItem("adminAuth");
    }
  }, []);

  // Load question sets from database
  useEffect(() => {
    const loadQuestionSets = async () => {
      try {
        const sets = await questionSetService.getQuestionSets();
        setAvailableQuestionSets(sets);
        // Select the first set by default if available
        if (sets.length > 0 && !selectedQuestionSetId) {
          setSelectedQuestionSetId(sets[0].id);
        }
      } catch (error) {
        console.error("Error loading question sets:", error);
        // Silently fail - will fall back to YAML files
      }
    };

    if (isAuthenticated) {
      loadQuestionSets();
    }
  }, [isAuthenticated, selectedQuestionSetId]);

  // Load questions to get accurate count and questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { questions } = await loadQuestionsFromYAML(
          `${selectedQuestionSet}.yaml`
        );
        setTotalQuestions(questions.length);
        setLoadedQuestions(questions);
      } catch (error) {
        console.warn("Using fallback question count:", error);
        // Fallback to default questions
        try {
          const { questions } = await loadDefaultQuestions();
          setTotalQuestions(questions.length);
          setLoadedQuestions(questions);
        } catch (fallbackError) {
          console.warn("Fallback also failed, using sample questions count");
          setTotalQuestions(sampleQuestions.length);
          setLoadedQuestions(sampleQuestions);
        }
      }
    };

    loadQuestions();
  }, [selectedQuestionSet]);

  const loadGameData = useCallback(async () => {
    setAdminState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const game = await gameService.getGame(gameCode);
      if (!game) {
        setAdminState((prev) => ({
          ...prev,
          error: "Game not found",
          loading: false,
        }));
        return;
      }

      const players = await gameService.getPlayers(game.id);
      const teamData = calculateTeamData(players);

      setAdminState((prev) => ({
        ...prev,
        selectedGame: game,
        players,
        teamData,
        loading: false,
      }));

      // Subscriptions are now managed by useAdminSubscriptions hook
    } catch (error) {
      setAdminState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to load game data",
        loading: false,
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
    const teams = ["adah", "ruth", "esther", "martha", "electa"];
    const teamData: Record<string, TeamData> = {};

    teams.forEach((team) => {
      const teamPlayers = players.filter((p) => p.team === team);
      const activePlayers = teamPlayers.filter((p) => p.is_active !== false);
      const queuedPlayers = teamPlayers.filter((p) => p.is_active === false);

      teamData[team] = {
        count: activePlayers.length,
        connected: activePlayers.length, // All loaded active players are considered connected
        names: activePlayers.map((p) => p.name),
        scores: activePlayers.reduce((sum, p) => sum + (p.score || 0), 0),
        queuedCount: queuedPlayers.length,
        queuedNames: queuedPlayers.map((p) => p.name),
      };
    });

    return teamData;
  };

  const handleStartGame = async () => {
    if (!adminState.selectedGame) return;

    console.log("Admin starting game:", adminState.selectedGame.id);
    try {
      await gameService.startGame(adminState.selectedGame.id);
      console.log("Game started successfully");

      // Update local game state to reflect the change
      setAdminState((prev) => ({
        ...prev,
        selectedGame: prev.selectedGame
          ? {
              ...prev.selectedGame,
              status: "active",
              current_question: 1,
            }
          : null,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to start game:", error);
      setAdminState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to start game",
      }));
    }
  };

  const handlePauseGame = async () => {
    if (!adminState.selectedGame) return;

    try {
      if (adminState.selectedGame.status === "active") {
        await gameService.pauseGame(adminState.selectedGame.id);
        toast.success("Game paused");
      } else if (adminState.selectedGame.status === "paused") {
        await gameService.resumeGame(adminState.selectedGame.id);
        toast.success("Game resumed");
      }
    } catch (error) {
      setAdminState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to pause/resume game",
      }));
    }
  };

  const handleStopGame = async () => {
    if (!adminState.selectedGame) return;

    if (
      !confirm(
        "Are you sure you want to end this game? This will send all players to the results page."
      )
    ) {
      return;
    }

    try {
      await gameService.endGame(adminState.selectedGame.id);
      toast.success("Game ended");

      // Update local game state to reflect the change immediately
      setAdminState((prev) => ({
        ...prev,
        selectedGame: prev.selectedGame
          ? {
              ...prev.selectedGame,
              status: "finished",
            }
          : null,
        error: null,
      }));
    } catch (error) {
      setAdminState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to end game",
      }));
    }
  };

  const handleNextQuestion = async () => {
    if (!adminState.selectedGame) return;

    try {
      await gameService.nextQuestion(adminState.selectedGame.id);
      toast.success("Advanced to next question");
    } catch (error) {
      setAdminState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to advance question",
      }));
    }
  };

  const adjustScore = () => {
    setAdminState((prev) => ({
      ...prev,
      error: "Manual score adjustment not yet implemented",
    }));
  };

  const loadAvailableGames = async () => {
    setAdminState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const games = await gameService.getAllGames();
      setAdminState((prev) => ({
        ...prev,
        availableGames: games,
        showGameList: true,
        loading: false,
      }));
    } catch (error) {
      setAdminState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load games",
        loading: false,
      }));
    }
  };

  const switchToGame = async (game: Game) => {
    setGameCode(game.game_code);
    setAdminState((prev) => ({
      ...prev,
      showGameList: false,
      loading: true,
    }));

    try {
      const players = await gameService.getPlayers(game.id);
      const teamData = calculateTeamData(players);

      setAdminState((prev) => ({
        ...prev,
        selectedGame: game,
        players,
        teamData,
        loading: false,
        error: null,
      }));

      // Subscriptions are now managed by useAdminSubscriptions hook

      setShowCreateGame(false);
      toast.success(`Connected to game ${game.game_code}!`);
    } catch (error) {
      setAdminState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to switch to game",
        loading: false,
      }));
    }
  };

  const switchGame = () => {
    loadAvailableGames();
  };

  const deleteGame = async (game: Game) => {
    if (
      !confirm(
        `Are you sure you want to delete game ${game.game_code}? This will permanently remove all game data and cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await gameService.deleteGame(game.id);

      // Remove from available games list
      setAdminState((prev) => ({
        ...prev,
        availableGames: prev.availableGames.filter((g) => g.id !== game.id),
      }));

      // If this was the currently selected game, disconnect
      if (adminState.selectedGame?.id === game.id) {
        setAdminState((prev) => ({
          selectedGame: null,
          players: [],
          teamData: {
            adah: { count: 0, connected: 0, names: [], scores: 0 },
            ruth: { count: 0, connected: 0, names: [], scores: 0 },
            esther: { count: 0, connected: 0, names: [], scores: 0 },
            martha: { count: 0, connected: 0, names: [], scores: 0 },
            electa: { count: 0, connected: 0, names: [], scores: 0 },
          },
          loading: false,
          error: null,
          availableGames: prev.availableGames,
          showGameList: prev.showGameList,
        }));
        setGameCode("");
        setShowCreateGame(true);
      }

      toast.success(`Game ${game.game_code} deleted successfully!`);
    } catch (error) {
      toast.error(
        `Failed to delete game: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const createNewGame = async () => {
    if (!hostName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsCreatingGame(true);
    try {
      const { game } = await gameService.createGame(
        hostName.trim(),
        selectedQuestionSetId || selectedQuestionSet
      );
      const newGameCode = game.game_code;

      // Copy questions from the selected question set to the game
      try {
        if (selectedQuestionSetId && availableQuestionSets.length > 0) {
          // Use database question set
          await questionSetService.copyQuestionsToGame(
            game.id,
            selectedQuestionSetId,
            true // Randomize question order for this game
          );
          console.log("Questions copied from database set to game");
        } else {
          // Fallback to loading from YAML and storing directly
          const { loadDefaultQuestions } = await import(
            "@/utils/questionLoader"
          );
          const questionData = await loadDefaultQuestions(true, false); // Randomize questions but NOT answers

          // Only store questions if not in development mode
          const isDevMode =
            !import.meta.env.VITE_SUPABASE_URL ||
            import.meta.env.VITE_SUPABASE_URL === "http://localhost:54321";

          if (!isDevMode) {
            await gameService.storeGameQuestions(
              game.id,
              questionData.questions
            );
            console.log("Questions stored from YAML fallback");
          } else {
            console.log(
              "Development mode: Skipping question storage to database"
            );
          }
        }
      } catch (questionError) {
        // Log the error but don't fail game creation
        console.error("Error storing questions:", questionError);
        toast.warning(
          "Game created but questions may not be synchronized. Continuing anyway."
        );
      }

      // Set the created game as the current game
      setGameCode(newGameCode);
      setAdminState((prev) => ({
        ...prev,
        selectedGame: game,
        players: [], // No players initially
        error: null,
      }));

      setShowCreateGame(false);
      toast.success(`Game created successfully! Code: ${newGameCode}`);
    } catch (error) {
      console.error("Error creating game:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create game";
      toast.error(`Failed to create game: ${errorMessage}`);
      setAdminState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    } finally {
      setIsCreatingGame(false);
    }
  };

  const totalPlayers = adminState.players.length;
  const totalConnected = adminState.players.length;

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} error={adminState.error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-6xl space-y-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Game Control Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {adminState.selectedGame && (
              <>
                <Badge
                  variant={
                    adminState.selectedGame.status === "active"
                      ? "default"
                      : "outline"
                  }
                >
                  {adminState.selectedGame.status.toUpperCase()}
                </Badge>
                <Button
                  onClick={switchGame}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Manage Games
                </Button>
              </>
            )}
            <button
              onClick={() => {
                localStorage.removeItem("adminAuth");
                setIsAuthenticated(false);
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>

        {/* QR Code Generation Section */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center space-x-2 text-xl font-semibold">
            <QrCode className="h-6 w-6 text-indigo-600" />
            <span>Table QR Codes</span>
          </h2>
          <p className="mb-4 text-gray-600">
            Generate printable QR codes for each team table. Print these at home
            before the event.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => window.open("/admin/qr-codes", "_blank")}
              className="flex items-center space-x-2 rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" />
              <span>Generate All Team QR Codes</span>
            </button>
          </div>
        </div>

        {/* Practice Management Section */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <PracticeManagement />
        </div>

        {/* Game List Management - Show when switching games */}
        {adminState.showGameList && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center space-x-2 text-xl font-semibold">
                <Monitor className="h-6 w-6 text-indigo-600" />
                <span>Available Games</span>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setAdminState((prev) => ({ ...prev, showGameList: false }))
                }
                className="flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            </div>

            {adminState.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Loading games...</span>
              </div>
            ) : adminState.availableGames.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Monitor className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p>No games found</p>
                <p className="text-sm">Create a new game to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminState.availableGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <code className="rounded bg-white px-3 py-1 font-mono text-lg font-bold">
                          {game.game_code}
                        </code>
                        <Badge
                          variant={
                            game.status === "active" ? "default" : "outline"
                          }
                        >
                          {game.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(game.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>
                            {new Date(game.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => switchToGame(game)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        size="sm"
                      >
                        Connect
                      </Button>
                      <Button
                        onClick={() => deleteGame(game)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 border-t pt-4">
              <Button
                onClick={() => {
                  setAdminState((prev) => ({ ...prev, showGameList: false }));
                  setShowCreateGame(true);
                }}
                variant="outline"
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Game Instead
              </Button>
            </div>
          </div>
        )}

        {/* Game Management */}
        {!adminState.selectedGame && !adminState.showGameList && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="space-y-6">
              {showCreateGame ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center space-x-2 text-xl font-semibold">
                      <Crown className="h-6 w-6 text-indigo-600" />
                      <span>Create New Game</span>
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateGame(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Or connect to existing game →
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="hostName">Your Name (Host)</Label>
                      <Input
                        id="hostName"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="Enter your name"
                        disabled={isCreatingGame}
                        onKeyDown={(e) => e.key === "Enter" && createNewGame()}
                      />
                    </div>

                    <div>
                      <Label htmlFor="questionSet">Question Set</Label>
                      <Select
                        value={selectedQuestionSetId || selectedQuestionSet}
                        onValueChange={(value) => {
                          // Check if it's a database ID or YAML file
                          const dbSet = availableQuestionSets.find(
                            (s) => s.id === value
                          );
                          if (dbSet) {
                            setSelectedQuestionSetId(value);
                          } else {
                            setSelectedQuestionSet(value);
                            setSelectedQuestionSetId("");
                          }
                        }}
                        disabled={isCreatingGame}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question set" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Show database question sets first */}
                          {availableQuestionSets.length > 0 && (
                            <>
                              <SelectItem value="__label__" disabled>
                                <span className="font-semibold text-gray-500">
                                  Database Sets
                                </span>
                              </SelectItem>
                              {availableQuestionSets.map((set) => (
                                <SelectItem key={set.id} value={set.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {set.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {set.description} ({set.question_count}{" "}
                                      questions)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                              <SelectItem value="__separator__" disabled>
                                <span className="font-semibold text-gray-500">
                                  ─────────────
                                </span>
                              </SelectItem>
                            </>
                          )}
                          {/* Fallback to YAML files */}
                          <SelectItem value="__label2__" disabled>
                            <span className="font-semibold text-gray-500">
                              YAML Files (Fallback)
                            </span>
                          </SelectItem>
                          {getAvailableQuestionSets().map((set) => (
                            <SelectItem key={set.id} value={set.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{set.title}</span>
                                <span className="text-sm text-gray-500">
                                  {set.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {totalQuestions} questions available
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/admin/question-sets")}
                          >
                            <Upload className="mr-1 h-3 w-3" />
                            Manage Sets
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/changelog")}
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Changelog
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={createNewGame}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={isCreatingGame || !hostName.trim()}
                    >
                      {isCreatingGame ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Game...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Game
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Connect to Existing Game
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateGame(true)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Create new game instead
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <Input
                        placeholder="Enter game code (e.g., ABC)"
                        value={gameCode}
                        onChange={(e) =>
                          setGameCode(e.target.value.toUpperCase())
                        }
                        maxLength={3}
                        className="flex-1"
                      />
                      <Button
                        onClick={loadGameData}
                        disabled={!gameCode || adminState.loading}
                        className="px-6"
                      >
                        {adminState.loading ? "Loading..." : "Connect"}
                      </Button>
                    </div>

                    <div className="text-center">
                      <div className="mb-2 text-sm text-gray-500">or</div>
                      <Button
                        onClick={loadAvailableGames}
                        variant="outline"
                        disabled={adminState.loading}
                        className="w-full"
                      >
                        {adminState.loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading Games...
                          </>
                        ) : (
                          <>
                            <Monitor className="mr-2 h-4 w-4" />
                            Browse All Available Games
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {adminState.error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="mr-3 h-5 w-5 text-red-500" />
                    <p className="text-red-700">{adminState.error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Game Status - Show when game is connected */}
        {adminState.selectedGame && gameCode && (
          <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold">Game Active</h2>
                <p className="text-indigo-100">
                  Announce this code to your players:{" "}
                  <span className="font-mono text-3xl font-bold text-white">
                    {gameCode}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-indigo-100">Total Players</div>
                <div className="text-3xl font-bold">{totalPlayers}</div>
              </div>
            </div>
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
            timerRemaining={30} // TODO: Implement real timer
            currentQuestion={
              (adminState.selectedGame.current_question || 1) - 1
            }
            totalQuestions={totalQuestions}
          />
        )}

        {/* Team Management - Only show when game is connected */}
        {adminState.selectedGame && (
          <TeamManagement
            players={adminState.teamData}
            scores={Object.fromEntries(
              Object.entries(adminState.teamData).map(([team, data]) => [
                team,
                data.scores,
              ])
            )}
            onAdjustScore={adjustScore}
          />
        )}

        {/* Current Question Display - Only show when game is connected */}
        {adminState.selectedGame &&
          adminState.selectedGame.current_question && (
            <QuestionDisplay
              currentQuestion={adminState.selectedGame.current_question - 1}
              question={
                loadedQuestions[adminState.selectedGame.current_question - 1]
              }
              gameId={adminState.selectedGame.id}
              totalPlayers={totalPlayers}
              allPlayers={adminState.players}
            />
          )}

        {/* Game Info Display */}
        {adminState.selectedGame && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold">Game Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Game Code:</span>{" "}
                {adminState.selectedGame.game_code}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {adminState.selectedGame.status}
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(adminState.selectedGame.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Current Question:</span>{" "}
                {adminState.selectedGame.current_question || "Not started"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
