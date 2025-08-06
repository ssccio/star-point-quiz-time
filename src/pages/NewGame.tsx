import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { Users, Star, Trophy, Medal, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { gameService } from "@/lib/gameService";

const NewGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Get player data from previous game or error state
  const {
    playerName,
    team: teamId,
    finalScores,
    playerRank,
    fromError,
  } = location.state || {};

  useEffect(() => {
    // If no player data and not from error, redirect to home
    if (!playerName && !fromError) {
      navigate("/");
      return;
    }
  }, [playerName, fromError, navigate]);

  // Handle error state (came from failed game join)
  if (fromError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="mx-auto max-w-md space-y-6 py-8">
          {/* Error Recovery Header */}
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center space-x-2">
              <Users className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Try Another Game
              </h1>
            </div>
            {playerName && (
              <div className="text-xl text-gray-600">
                Hello,{" "}
                <span className="font-semibold text-indigo-600">
                  {playerName}
                </span>
              </div>
            )}
          </div>

          {/* Join New Game */}
          <Card className="p-6">
            <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
              Enter New Game Code
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="gameCode">Game Code</Label>
                <Input
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter 3-letter code (e.g., XYZ)"
                  maxLength={3}
                  className="text-center text-2xl font-bold tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && joinNewGame()}
                  autoFocus
                  disabled={isJoining}
                />
              </div>

              <Button
                onClick={joinNewGame}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
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
            </div>
          </Card>

          {/* Alternative Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Return to Main Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!playerName || !teamId || !finalScores) {
    navigate("/");
    return null;
  }

  const team = TEAMS[teamId as keyof typeof TEAMS];
  const teamColor = TEAM_COLORS[teamId as keyof typeof TEAM_COLORS];
  const playerScore = finalScores[teamId] || 0;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRankText = (rank: number) => {
    switch (rank) {
      case 1:
        return "1st Place!";
      case 2:
        return "2nd Place!";
      case 3:
        return "3rd Place!";
      default:
        return `${rank}th Place`;
    }
  };

  const joinNewGame = async () => {
    if (!gameCode.trim()) {
      toast.error("Please enter a game code");
      return;
    }

    if (gameCode.length !== 3) {
      toast.error("Game code must be 3 characters");
      return;
    }

    setIsJoining(true);
    try {
      // Check if game exists first
      const game = await gameService.getGame(gameCode.toUpperCase());
      if (!game) {
        toast.error("Game not found");
        setIsJoining(false);
        return;
      }

      if (game.status === "finished") {
        toast.error("This game has already finished");
        setIsJoining(false);
        return;
      }
      // Allow joining active/paused games - the service will handle reconnection/queuing

      // Join the new game with the same player name, let system assign team
      const { game: joinedGame, player } = await gameService.joinGame(
        gameCode.toUpperCase(),
        playerName
      );

      const newTeamName = TEAMS[player.team as keyof typeof TEAMS].name;

      // Store new game data
      localStorage.setItem(
        "gameData",
        JSON.stringify({
          gameId: joinedGame.id,
          playerId: player.id,
          playerName: player.name,
          team: player.team,
          isHost: false,
          gameCode: gameCode.toUpperCase(),
        })
      );

      // Check if this is a reconnection (game is already active) or new join (waiting)
      if (joinedGame.status === "active" || joinedGame.status === "paused") {
        toast.success(
          `Welcome back to Team ${newTeamName}! Rejoining the game...`
        );
        // If game is active, go directly to the game page
        navigate("/game", {
          state: {
            playerName: player.name,
            team: player.team,
          },
        });
      } else {
        toast.success(
          `Welcome to your new game! You've been assigned to Team ${newTeamName}`
        );
        navigate("/lobby");
      }
    } catch (error: unknown) {
      console.error("Error joining game:", error);

      // Check if it's a specific game service error
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "GAME_FINISHED"
      ) {
        toast.error("This game has already finished.");
      } else if (
        error instanceof Error &&
        error.message?.includes("already exists")
      ) {
        toast.error(
          "You're already in this game! Please check your connection."
        );
      } else {
        toast.error("Failed to join game. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-md space-y-6 py-8">
        {/* Welcome Back Header */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <Users className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          </div>
          <div className="text-xl text-gray-600">
            Hello,{" "}
            <span className="font-semibold text-indigo-600">{playerName}</span>
          </div>
        </div>

        {/* Previous Game Results */}
        <Card className="p-6">
          <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
            Your Last Game
          </h2>

          <div className="space-y-4">
            {/* Team & Score */}
            <div className="text-center">
              <div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
                style={{ backgroundColor: teamColor }}
              >
                <Star className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">
                  Team {team.name}
                </div>
                <div className="text-sm text-gray-600">{team.heroine}</div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {playerScore}
                  </span>
                  <span className="text-sm text-gray-500">points</span>
                </div>
              </div>
            </div>

            {/* Rank */}
            <div className="flex items-center justify-center space-x-2 rounded-lg bg-gray-50 p-3">
              {getRankIcon(playerRank)}
              <span className="font-semibold text-gray-900">
                {getRankText(playerRank)}
              </span>
            </div>
          </div>
        </Card>

        {/* Join New Game */}
        <Card className="p-6">
          <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
            Join Another Game
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="gameCode">Enter New Game Code</Label>
              <Input
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter 3-letter code (e.g., XYZ)"
                maxLength={3}
                className="text-center text-2xl font-bold tracking-widest"
                onKeyDown={(e) => e.key === "Enter" && joinNewGame()}
                autoFocus
                disabled={isJoining}
              />
            </div>

            <Button
              onClick={joinNewGame}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isJoining || !gameCode.trim() || gameCode.length !== 3}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Game...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Join New Game
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Info */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">
            What happens next?
          </h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div>• You'll be automatically assigned to a new team</div>
            <div>• Wait in the lobby for the new game to start</div>
            <div>• Play another round of Eastern Star trivia!</div>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Return to Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewGame;
