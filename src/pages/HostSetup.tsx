import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gameService } from "@/lib/gameService";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { Loader2, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

const HostSetup = () => {
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [teamUrls, setTeamUrls] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const createGame = async () => {
    if (!hostName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsCreating(true);
    try {
      const {
        game,
        player,
        gameCode: code,
      } = await gameService.createGame(hostName.trim());

      setGameCode(code);

      // Generate team-specific URLs
      const baseUrl = `${window.location.origin}/join/${code}`;
      const urls = {
        general: baseUrl,
        adah: `${baseUrl}/adah`,
        ruth: `${baseUrl}/ruth`,
        esther: `${baseUrl}/esther`,
        martha: `${baseUrl}/martha`,
        electa: `${baseUrl}/electa`,
      };
      setTeamUrls(urls);

      toast.success("Game created successfully!");

      // Store game data for lobby
      localStorage.setItem(
        "gameData",
        JSON.stringify({
          gameId: game.id,
          playerId: player.id,
          playerName: player.name,
          isHost: true,
          gameCode: code,
        })
      );
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyUrl = async (url: string, teamName?: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        `${teamName ? `Team ${teamName}` : "General"} URL copied to clipboard!`
      );
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const goToLobby = () => {
    navigate("/lobby");
  };

  if (gameCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="mx-auto max-w-lg space-y-6">
          <Card className="p-8 text-center">
            <div className="space-y-6">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  Game Created!
                </h1>
                <p className="text-gray-600">Share this with your players</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Game Code
                  </Label>
                  <div className="mt-1 rounded-lg border-2 border-dashed bg-gray-50 p-4">
                    <div className="text-4xl font-bold tracking-wider text-indigo-600">
                      {gameCode}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block text-sm font-medium text-gray-700">
                    Table QR Codes - Generate one for each table
                  </Label>
                  <div className="space-y-3">
                    {Object.entries(TEAMS).map(([teamId, team]) => (
                      <div
                        key={teamId}
                        className="rounded-lg border p-3"
                        style={{ borderColor: team.color + "40" }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: team.color }}
                            />
                            <span className="font-medium text-gray-900">
                              Table {team.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({team.meaning})
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyUrl(teamUrls[teamId], team.name)}
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </Button>
                        </div>
                        <Input
                          value={teamUrls[teamId]}
                          readOnly
                          className="font-mono text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-700">
                    General Join URL (auto-assigns teams)
                  </Label>
                  <div className="mt-1 flex space-x-2">
                    <Input
                      value={teamUrls.general}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyUrl(teamUrls.general)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <QrCode className="h-4 w-4" />
                  <span>Generate QR code from the URL above</span>
                </div>

                <Button
                  onClick={goToLobby}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Go to Game Lobby
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-3 font-semibold text-gray-900">
              Meeting Setup Instructions:
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <strong>1. Print QR codes</strong> - Generate QR codes from the
                5 table URLs above
              </div>
              <div>
                <strong>2. Place at tables</strong> - Each star point table gets
                its team's QR code
              </div>
              <div>
                <strong>3. Players scan</strong> - Automatically joins their
                table's team
              </div>
              <div>
                <strong>4. Start game</strong> - When ready, go to lobby and
                start the quiz
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Host a Game
            </h1>
            <p className="text-gray-600">
              Create a new Eastern Star quiz session
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="hostName">Your Name</Label>
              <Input
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                disabled={isCreating}
                onKeyDown={(e) => e.key === "Enter" && createGame()}
              />
            </div>

            <Button
              onClick={createGame}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Game...
                </>
              ) : (
                "Create Game"
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HostSetup;
