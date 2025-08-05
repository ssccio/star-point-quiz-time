import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { Users, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { gameService } from "@/lib/gameService";

const TeamJoin = () => {
  const [searchParams] = useSearchParams();
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [step, setStep] = useState<"name" | "code">("name");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const team = searchParams.get("team");
  const validTeams = ["adah", "ruth", "esther", "martha", "electa"];
  const assignedTeam = team && validTeams.includes(team) ? team : null;

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
      // Check if game exists first
      const game = await gameService.getGame(gameCode.toUpperCase());
      if (!game) {
        toast.error("Game not found - it may have been deleted or finished");
        setIsJoining(false);
        return;
      }

      if (game.status !== "waiting") {
        toast.error(
          "This game has already started and cannot accept new players"
        );
        setIsJoining(false);
        return;
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
        toast.success(`Welcome to Team ${teamName}!`);
        navigate("/lobby");
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game. It may be full or already started.");
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
