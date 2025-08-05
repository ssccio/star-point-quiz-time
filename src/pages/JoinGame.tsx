import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gameService } from "@/lib/gameService";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const JoinGame = () => {
  const { gameCode, team } = useParams<{ gameCode: string; team?: string }>();
  const location = useLocation();
  const [isJoining, setIsJoining] = useState(false);
  const [gameExists, setGameExists] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // Check if name was passed from QR code flow
  const passedName = location.state?.playerName;
  const fromQRCode = location.state?.fromQRCode;
  const [playerName, setPlayerName] = useState(passedName || "");

  // Validate team parameter if provided
  const validTeams = ["adah", "ruth", "esther", "martha", "electa"];
  const preAssignedTeam = team && validTeams.includes(team) ? team : null;

  // Check if game exists when component mounts
  useEffect(() => {
    if (gameCode) {
      checkGameExists();
    }
  }, [gameCode]);

  const checkGameExists = async () => {
    if (!gameCode) return;

    try {
      const game = await gameService.getGame(gameCode);
      setGameExists(!!game);

      if (!game) {
        toast.error("Game not found - it may have been deleted or finished");
      } else if (game.status !== "waiting") {
        toast.error("This game has already started and cannot accept new players");
        setGameExists(false);
      }
    } catch (error) {
      console.error("Error checking game:", error);
      setGameExists(false);
      toast.error("Error finding game");
    }
  };

  const joinGame = async () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!gameCode) {
      toast.error("Invalid game code");
      return;
    }

    setIsJoining(true);
    try {
      const { game, player, isQueued } = await gameService.joinGame(
        gameCode,
        playerName.trim(),
        preAssignedTeam || undefined
      );

      const teamName = TEAMS[player.team as keyof typeof TEAMS].name;
      
      // Store game data
      localStorage.setItem(
        "gameData",
        JSON.stringify({
          gameId: game.id,
          playerId: player.id,
          playerName: player.name,
          team: player.team,
          isHost: false,
          gameCode: gameCode,
          isQueued: isQueued || false,
        })
      );

      if (isQueued) {
        toast.success(`You're queued for Team ${teamName}! You'll join after the current game ends.`);
        navigate("/queue", {
          state: {
            playerName: player.name,
            team: player.team,
            gameId: game.id,
            gameCode: gameCode,
          }
        });
      } else {
        if (preAssignedTeam) {
          toast.success(`Welcome to Team ${teamName}!`);
        } else {
          toast.success(`Welcome! You've been assigned to Team ${teamName}`);
        }
        navigate("/lobby");
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game. It may be full or already started.");
    } finally {
      setIsJoining(false);
    }
  };

  if (gameExists === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="p-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Checking game...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (gameExists === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="space-y-4">
            <div className="text-6xl text-red-600">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900">Game Not Available</h1>
            <p className="text-gray-600">
              The game code <strong>{gameCode}</strong> is no longer available. It may have been deleted, finished, or already started.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/new-game", {
                  state: {
                    playerName: playerName || passedName,
                    team: preAssignedTeam,
                    fromError: true
                  }
                })}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Enter New Game Code
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Return to Main Menu
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center space-x-2">
              <Users className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Join Game</h1>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Game Code</div>
              <div className="text-2xl font-bold tracking-wider text-indigo-600">
                {gameCode}
              </div>
              {preAssignedTeam && (
                <div
                  className="mt-4 rounded-lg p-3"
                  style={{
                    backgroundColor: `${TEAM_COLORS[preAssignedTeam as keyof typeof TEAM_COLORS]}20`,
                  }}
                >
                  <div className="text-sm text-gray-600">You're joining</div>
                  <div className="flex items-center justify-center space-x-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{
                        backgroundColor:
                          TEAM_COLORS[
                            preAssignedTeam as keyof typeof TEAM_COLORS
                          ],
                      }}
                    />
                    <span
                      className="font-bold"
                      style={{
                        color:
                          TEAM_COLORS[
                            preAssignedTeam as keyof typeof TEAM_COLORS
                          ],
                      }}
                    >
                      Team {TEAMS[preAssignedTeam as keyof typeof TEAMS].name}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {TEAMS[preAssignedTeam as keyof typeof TEAMS].meaning}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {fromQRCode && passedName ? (
              <div className="text-center">
                <div className="mb-2 text-lg text-gray-600">Welcome back,</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {passedName}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Ready to join the game!
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isJoining}
                  onKeyDown={(e) => e.key === "Enter" && joinGame()}
                />
              </div>
            )}

            <Button
              onClick={joinGame}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isJoining || !playerName.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Game...
                </>
              ) : (
                "Join Game"
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">
              What happens next?
            </h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div>• You'll be automatically assigned to a team</div>
              <div>• Wait in the lobby for the game to start</div>
              <div>• Answer Eastern Star trivia questions</div>
              <div>• Compete for the highest score!</div>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Wrong game? Go home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JoinGame;
