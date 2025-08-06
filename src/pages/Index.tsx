import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Star, GamepadIcon, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { gameService } from "@/lib/gameService";
import { TEAMS } from "@/utils/constants";

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamParam = searchParams.get("team");
  const [gameCode, setGameCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [existingGameData, setExistingGameData] = useState<{
    gameId: string;
    gameCode: string;
    playerName: string;
    team: string;
    playerId?: string;
  } | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Check for existing game data on mount
  useEffect(() => {
    const gameData = localStorage.getItem("gameData");
    if (gameData) {
      try {
        const parsedGameData = JSON.parse(gameData);
        if (
          parsedGameData.gameId &&
          parsedGameData.gameCode &&
          parsedGameData.playerName
        ) {
          setExistingGameData(parsedGameData);
        }
      } catch (error) {
        console.error("Error parsing stored game data:", error);
        localStorage.removeItem("gameData"); // Clean up invalid data
      }
    }
  }, []);

  // If team parameter is provided, go directly to practice game
  useEffect(() => {
    if (teamParam) {
      navigate(`/game?mode=practice&team=${teamParam}`);
    }
  }, [teamParam, navigate]);

  const handleReconnect = async () => {
    if (!existingGameData) return;

    setIsReconnecting(true);
    try {
      // Check if the game still exists
      const game = await gameService.getGame(existingGameData.gameCode);
      if (!game) {
        toast.error("Your previous game is no longer available");
        localStorage.removeItem("gameData");
        setExistingGameData(null);
        setIsReconnecting(false);
        return;
      }

      if (game.status === "finished") {
        toast.info("Your previous game has finished");
        localStorage.removeItem("gameData");
        setExistingGameData(null);
        setIsReconnecting(false);
        return;
      }

      // Attempt to reconnect by "joining" again with existing name
      const { player } = await gameService.joinGame(
        existingGameData.gameCode,
        existingGameData.playerName,
        existingGameData.team
      );

      // Update localStorage with fresh data
      const updatedGameData = {
        ...existingGameData,
        playerId: player.id, // Ensure we have the correct player ID
      };
      localStorage.setItem("gameData", JSON.stringify(updatedGameData));

      // Navigate to appropriate page based on game status
      if (game.status === "waiting") {
        toast.success("Reconnected! Welcome back to the lobby.");
        navigate("/lobby");
      } else {
        toast.success("Reconnected! Rejoining the game...");
        navigate("/game", {
          state: {
            playerName: existingGameData.playerName,
            team: existingGameData.team,
          },
        });
      }
    } catch (error) {
      console.error("Error reconnecting:", error);
      toast.error("Failed to reconnect. Please try joining manually.");
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleClearGameData = () => {
    localStorage.removeItem("gameData");
    setExistingGameData(null);
    toast.info("Previous game data cleared");
  };

  const handleJoinGame = async () => {
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
        toast.error("Game not found - please check the code");
        setIsJoining(false);
        return;
      }

      // Navigate to the join game page
      navigate(`/join/${gameCode.toUpperCase()}`);
    } catch (error) {
      console.error("Error checking game:", error);
      toast.error("Error finding game - please try again");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-3">
            <Star className="h-12 w-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Eastern Star Quiz
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Test your knowledge of the Order of the Eastern Star
          </p>
        </div>

        {/* Reconnection Card - Show if existing game data found */}
        {existingGameData && (
          <Card className="border-amber-200 bg-amber-50 p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-6 w-6 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-900">
                      Continue Previous Game
                    </h3>
                    <p className="text-sm text-amber-700">
                      You have an unfinished game as{" "}
                      <strong>{existingGameData.playerName}</strong> on Team{" "}
                      <strong>
                        {
                          TEAMS[existingGameData.team as keyof typeof TEAMS]
                            ?.name
                        }
                      </strong>
                    </p>
                    <p className="text-xs text-amber-600">
                      Game: {existingGameData.gameCode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearGameData}
                  className="text-amber-700 hover:text-amber-900"
                >
                  ✕
                </Button>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isReconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reconnect
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClearGameData}>
                  Start Fresh
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Join Multiplayer Game - Primary Action */}
          <Card className="p-8 text-center transition-shadow hover:shadow-lg">
            <div className="space-y-4">
              <div className="flex justify-center">
                <GamepadIcon className="h-16 w-16 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Join Game</h2>
              <p className="text-gray-600">
                Enter your game code to join an Eastern Star quiz session with
                your friends.
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="gameCode">Game Code</Label>
                  <Input
                    id="gameCode"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    placeholder="Enter 3-letter code (e.g., ABC)"
                    maxLength={3}
                    className="text-center text-2xl font-bold tracking-widest"
                    onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                    disabled={isJoining}
                  />
                </div>
                <Button
                  onClick={handleJoinGame}
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
                    "Join Game"
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Single Player Practice */}
          <Card
            className="cursor-pointer p-8 text-center transition-shadow hover:shadow-lg"
            onClick={() => navigate("/teams")}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <Users className="h-16 w-16 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Practice Mode
              </h2>
              <p className="text-gray-600">
                Play solo to practice your Eastern Star knowledge. Choose your
                favorite star point team.
              </p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Practice Solo
              </Button>
            </div>
          </Card>
        </div>

        {/* Admin Link - Small and Unobtrusive */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Admin Panel
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Questions cover the history, symbols, and teachings of the Order of
            the Eastern Star
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
