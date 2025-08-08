import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { Users, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { gameService } from "@/lib/gameService";
import { usePhoneLockHandler } from "@/hooks/usePhoneLockHandler";

const TeamJoin = () => {
  const [searchParams] = useSearchParams();
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [step, setStep] = useState<"name" | "code">("name");
  const [isJoining, setIsJoining] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const navigate = useNavigate();

  const team = searchParams.get("team");
  const validTeams = ["adah", "ruth", "esther", "martha", "electa"];
  const assignedTeam = team && validTeams.includes(team) ? team : null;

  // Create a unique storage key for this team's pre-game state
  const storageKey = assignedTeam ? `teamJoin_${assignedTeam}` : null;

  // Use comprehensive phone lock handler
  const { restoreState, clearState, retryOperation } = usePhoneLockHandler({
    storageKey: storageKey || "",
    userState: {
      playerName,
      step,
      assignedTeam,
      gameCode,
    },
    onReconnect: async () => {
      // Handle reconnection after phone unlock
      console.log("Reconnecting after phone unlock...");

      // Check for existing game data first - but only for active games
      const existingGameData = localStorage.getItem("gameData");
      if (existingGameData) {
        try {
          const gameData = JSON.parse(existingGameData);
          if (gameData.team === assignedTeam) {
            // Verify game still exists and is active with retry logic
            await retryOperation(async () => {
              const game = await gameService.getGame(gameData.gameCode);
              if (game && (game.status === "active" || game.status === "paused")) {
                toast.success(
                  `Welcome back, ${gameData.playerName}! Returning to your active game...`
                );
                
                if (gameData.isQueued) {
                  navigate("/queue");
                } else if (game.status === "active" || game.status === "paused") {
                  navigate("/game");
                } else {
                  navigate("/lobby");
                }
              } else {
                // Game doesn't exist or isn't active - clear old data and start fresh
                localStorage.removeItem("gameData");
                if (game && game.status === "waiting") {
                  toast.info("Previous game ended. Starting fresh for the new game.");
                } else if (game && game.status === "finished") {
                  toast.info("Previous game finished. Starting fresh for a new game.");
                } else {
                  toast.info("Starting fresh. Please enter your name to join.");
                }
                throw new Error("Game no longer active - starting fresh");
              }
            });
            return;
          }
        } catch (error) {
          console.error("Error handling existing game data:", error);
          localStorage.removeItem("gameData");
          // Don't return here - let it fall through to restore team join state
        }
      }

      // If no existing game data, restore team join state
      const savedState = restoreState();
      if (savedState?.userState) {
        const { 
          playerName: savedName, 
          step: savedStep, 
          gameCode: savedGameCode 
        } = savedState.userState;
        
        if (savedName) {
          setPlayerName(savedName);
          
          if (savedStep) {
            setStep(savedStep);
          }
          
          if (savedGameCode) {
            setGameCode(savedGameCode);
          }
          
          if (savedStep === "code") {
            toast.success(`Welcome back, ${savedName}! Ready for the game code.`);
          } else {
            toast.success(`Welcome back, ${savedName}!`);
          }
        }
      }
    },
    enableToasts: true,
  });

  // Restore state on mount
  useEffect(() => {
    const handleInitialLoad = async () => {
      // Check for existing game data first - but only for active games
      const existingGameData = localStorage.getItem("gameData");
      if (existingGameData) {
        try {
          const gameData = JSON.parse(existingGameData);
          if (gameData.team === assignedTeam) {
            // Only auto-rejoin if the game is still active/paused
            const game = await gameService.getGame(gameData.gameCode);
            if (game && (game.status === "active" || game.status === "paused")) {
              toast.success(
                `Welcome back, ${gameData.playerName}! Returning to your active game...`
              );
              
              if (gameData.isQueued) {
                navigate("/queue");
              } else if (game.status === "active" || game.status === "paused") {
                navigate("/game");
              } else {
                navigate("/lobby");
              }
              return;
            } else {
              // Game doesn't exist or isn't active - clear old data and start fresh
              localStorage.removeItem("gameData");
              if (game && game.status === "waiting") {
                toast.info("Previous game ended. Starting fresh for the new game.");
              } else if (game && game.status === "finished") {
                toast.info("Previous game finished. Starting fresh for a new game.");
              } else {
                toast.info("Starting fresh. Please enter your name to join.");
              }
            }
          }
        } catch (error) {
          console.error("Error parsing existing game data:", error);
          localStorage.removeItem("gameData");
        }
      }

      // Restore team join state (only for this team assignment flow)
      const savedState = restoreState();
      if (savedState?.userState) {
        const { 
          playerName: savedName, 
          step: savedStep, 
          gameCode: savedGameCode 
        } = savedState.userState;
        
        if (savedName) {
          setIsResuming(true);
          setPlayerName(savedName);
          
          // Restore the step (name or code)
          if (savedStep) {
            setStep(savedStep);
          }
          
          // Restore game code if it was saved
          if (savedGameCode) {
            setGameCode(savedGameCode);
          }
          
          setTimeout(() => setIsResuming(false), 3000);
          
          if (savedStep === "code") {
            toast.success(`Welcome back, ${savedName}! Ready for the game code.`);
          } else {
            toast.success(`Welcome back, ${savedName}!`);
          }
        }
      }
    };

    if (assignedTeam) {
      handleInitialLoad().catch(console.error);
    }
  }, [assignedTeam, navigate, restoreState]);

  if (!assignedTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="space-y-4">
            <div className="text-6xl text-red-600">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid Team</h1>
            <p className="text-gray-600">
              Please scan a valid team QR code to join your table's team.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const teamInfo = TEAMS[assignedTeam as keyof typeof TEAMS];
  const teamColor = TEAM_COLORS[assignedTeam as keyof typeof TEAM_COLORS];

  const handleNameSubmit = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setStep("code");
  };

  const handleGameCodeSubmit = async () => {
    if (!gameCode.trim()) {
      toast.error("Please enter the game code");
      return;
    }

    if (gameCode.length !== 3) {
      toast.error("Game code must be 3 characters");
      return;
    }

    setIsJoining(true);

    try {
      await retryOperation(async () => {
        // Check if game exists first
        const game = await gameService.getGame(gameCode.toUpperCase());
        if (!game) {
          throw new Error(
            "Game not found - it may have been deleted or finished"
          );
        }

        if (game.status === "finished") {
          throw new Error("This game has already finished");
        }

        // Join the game directly with pre-assigned team
        const {
          game: joinedGame,
          player,
          isQueued,
        } = await gameService.joinGame(
          gameCode.toUpperCase(),
          playerName.trim(),
          assignedTeam || undefined
        );

        const teamName = TEAMS[player.team as keyof typeof TEAMS].name;

        // Store game data
        localStorage.setItem(
          "gameData",
          JSON.stringify({
            gameId: joinedGame.id,
            playerId: player.id,
            playerName: player.name,
            team: player.team,
            isHost: false,
            gameCode: gameCode.toUpperCase(),
            isQueued: isQueued || false,
          })
        );

        // Clean up the temporary team join state since we've successfully joined a game
        clearState();

        if (isQueued) {
          toast.success(
            `You're queued for Team ${teamName}! You'll join after the current game ends.`
          );
          navigate("/queue", {
            state: {
              playerName: player.name,
              team: player.team,
              gameId: joinedGame.id,
              gameCode: gameCode.toUpperCase(),
            },
          });
        } else {
          // Check if this is a reconnection (game is already active) or new join (waiting)
          if (
            joinedGame.status === "active" ||
            joinedGame.status === "paused"
          ) {
            toast.success(
              `Welcome back to Team ${teamName}! Rejoining the game...`
            );
            // If game is active, go directly to the game page
            navigate("/game", {
              state: {
                playerName: player.name,
                team: player.team,
              },
            });
          } else {
            toast.success(`Welcome to Team ${teamName}!`);
            navigate("/lobby");
          }
        }
      });
    } catch (error: unknown) {
      console.error("Error joining game:", error);

      if (error instanceof Error) {
        // Show the specific error message from the operation
        toast.error(error.message);
      } else {
        toast.error("Failed to join game. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}05 100%)`,
      }}
    >
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          {/* Team Header */}
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center space-x-2">
              <Star
                className="h-8 w-8"
                style={{ color: teamColor }}
                fill={teamColor}
              />
              <h1 className="text-3xl font-bold" style={{ color: teamColor }}>
                Team {teamInfo.name}
              </h1>
            </div>

            <div
              className="mb-4 rounded-lg p-4"
              style={{ backgroundColor: `${teamColor}20` }}
            >
              <div className="mb-2 flex items-center justify-center space-x-2">
                <div
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
                <span
                  className="text-lg font-bold"
                  style={{ color: teamColor }}
                >
                  {teamInfo.heroine}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Symbolizing <strong>{teamInfo.meaning}</strong>
              </div>
            </div>
          </div>

          {step === "name" ? (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  Welcome to your table!
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your name to get ready for trivia night
                </p>
              </div>

              <div>
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="First name, last initial (e.g., Mary J.)"
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  autoFocus
                />
              </div>

              <Button
                onClick={handleNameSubmit}
                className="w-full"
                style={{ backgroundColor: teamColor, borderColor: teamColor }}
                disabled={!playerName.trim()}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isResuming && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-sm text-green-800">
                    🎉 <strong>Welcome back!</strong> You're ready to enter the
                    game code.
                  </p>
                </div>
              )}

              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  Hello, {playerName}!
                </h2>
                <p className="text-sm text-gray-600">
                  When the host announces the game code, enter it below to join
                </p>
              </div>

              <div>
                <Label htmlFor="gameCode">Game Code</Label>
                <Input
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter 3-letter code (e.g., ABC)"
                  maxLength={3}
                  className="text-center text-2xl font-bold tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && handleGameCodeSubmit()}
                  autoFocus
                />
              </div>

              <Button
                onClick={handleGameCodeSubmit}
                className="w-full"
                style={{ backgroundColor: teamColor, borderColor: teamColor }}
                disabled={
                  isJoining || !gameCode.trim() || gameCode.length !== 3
                }
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining Game...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Join Game
                  </>
                )}
              </Button>

              <div
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: `${teamColor}10` }}
              >
                <div className="text-sm" style={{ color: teamColor }}>
                  <strong>Waiting for game code announcement...</strong>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Your host will announce the code when ready to start
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => setStep("name")}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change name
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeamJoin;
