import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Users,
  QrCode,
  Play,
  Copy,
  Check,
  Home,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { gameService } from "@/lib/gameService";
import { questionSetService } from "@/lib/questionSetService";
import { TEAMS } from "@/utils/constants";
import type { QuestionSet } from "@/lib/questionSetService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Host = () => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [selectedSetId, setSelectedSetId] = useState("");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [gameId, setGameId] = useState("");
  const [players, setPlayers] = useState<
    Array<{
      id: string;
      name: string;
      team: string;
      score?: number;
    }>
  >([]);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    loadQuestionSets();
  }, []);

  useEffect(() => {
    if (gameCode) {
      // Subscribe to players joining
      const interval = setInterval(async () => {
        try {
          const game = await gameService.getGame(gameCode);
          if (game) {
            const gamePlayers = await gameService.getPlayers(game.id);
            setPlayers(gamePlayers);
          }
        } catch (error) {
          console.error("Error fetching players:", error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [gameCode]);

  const loadQuestionSets = async () => {
    try {
      const sets = await questionSetService.getQuestionSets();
      setQuestionSets(sets);
      if (sets.length > 0) {
        setSelectedSetId(sets[0].id);
      }
    } catch (error) {
      console.error("Error loading question sets:", error);
    }
  };

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!selectedSetId) {
      toast.error("Please select a question set");
      return;
    }

    setIsCreating(true);
    try {
      const { game } = await gameService.createGame(hostName, selectedSetId);

      setGameCode(game.game_code);
      setGameId(game.id);
      toast.success(`Game created! Code: ${game.game_code}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartGame = async () => {
    if (players.length === 0) {
      toast.error("Wait for at least one player to join");
      return;
    }

    setIsStarting(true);
    try {
      await gameService.startGame(gameId);
      toast.success("Game started!");
      navigate("/game", {
        state: {
          playerName: hostName,
          isHost: true,
          gameCode,
        },
      });
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
      setIsStarting(false);
    }
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    toast.success("Game code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQRUrl = (team: string) => {
    return `${window.location.origin}/join?team=${team}&code=${gameCode}`;
  };

  const teamsList = Object.entries(TEAMS);

  if (gameCode) {
    // Game created - show waiting room
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="space-y-3 py-8 text-center">
            <Star className="mx-auto h-16 w-16 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Game Ready!</h1>
            <p className="text-lg text-gray-600">
              Share the code with your players
            </p>
          </div>

          {/* Game Code Display */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-4 text-center">
                <Label className="text-lg">Game Code</Label>
                <div className="flex items-center justify-center gap-4">
                  <div className="rounded-lg bg-indigo-50 px-8 py-4 text-6xl font-bold tracking-widest text-indigo-600">
                    {gameCode}
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={copyGameCode}
                    className="h-16"
                  >
                    {copied ? (
                      <Check className="h-6 w-6 text-green-600" />
                    ) : (
                      <Copy className="h-6 w-6" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Players can join at {window.location.origin}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players Joined ({players.length})
                </span>
                {players.length > 0 && (
                  <Badge variant="success" className="px-3 py-1 text-lg">
                    Ready to Start!
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  Waiting for players to join...
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 rounded-lg border p-3"
                      style={{
                        backgroundColor: `${TEAMS[player.team as keyof typeof TEAMS]?.color}20`,
                        borderColor:
                          TEAMS[player.team as keyof typeof TEAMS]?.color,
                      }}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            TEAMS[player.team as keyof typeof TEAMS]?.color,
                        }}
                      />
                      <span className="font-medium">{player.name}</span>
                      <span className="text-sm text-gray-500">
                        ({TEAMS[player.team as keyof typeof TEAMS]?.name})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team QR Codes */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Table QR Codes (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                If using table QR codes, players can scan to auto-join their
                team
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/qr-codes")}
                className="w-full"
              >
                <QrCode className="mr-2 h-4 w-4" />
                View/Print QR Codes
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Cancel Game
            </Button>
            <Button
              onClick={handleStartGame}
              disabled={players.length === 0 || isStarting}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Game ({players.length} players)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game setup
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-3 py-8 text-center">
          <Star className="mx-auto h-16 w-16 text-indigo-600" />
          <h1 className="text-4xl font-bold text-gray-900">Host a Game</h1>
          <p className="text-lg text-gray-600">Set up your Eastern Star quiz</p>
        </div>

        {/* Setup Form */}
        <Card className="border-0 shadow-xl">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <Label htmlFor="hostName">Your Name</Label>
              <Input
                id="hostName"
                placeholder="Enter your name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionSet">Question Set</Label>
              <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                <SelectTrigger className="text-lg">
                  <SelectValue placeholder="Select a question set" />
                </SelectTrigger>
                <SelectContent>
                  {questionSets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      <div>
                        <div className="font-medium">{set.name}</div>
                        <div className="text-sm text-gray-500">
                          {set.question_count || 0} questions
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateGame}
              disabled={!hostName.trim() || !selectedSetId || isCreating}
              className="h-14 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-lg font-semibold hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Game...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  Create Game
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 transition-colors hover:text-indigo-600"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Host;
