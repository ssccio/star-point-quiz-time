import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { Users, Clock, Star, CheckCircle } from "lucide-react";
import { gameService } from "@/lib/gameService";

const Queue = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameStatus, setGameStatus] = useState<string>("active");
  const [queuedCount, setQueuedCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  const { playerName, team: teamId, gameId, gameCode } = location.state || {};

  useEffect(() => {
    if (!playerName || !teamId || !gameId) {
      navigate("/");
      return;
    }

    // Subscribe to game status changes
    const subscription = gameService.subscribeToGame(gameId, (updatedGame) => {
      setGameStatus(updatedGame.status);
      setCurrentQuestion(updatedGame.current_question || 1);

      // If game has finished, redirect to lobby for next game
      if (updatedGame.status === "finished") {
        setTimeout(() => {
          navigate("/lobby");
        }, 2000);
      }
    });

    // Load initial queued players count
    const loadQueuedCount = async () => {
      try {
        const count = await gameService.getQueuedPlayersCount(gameId);
        setQueuedCount(count);
      } catch (error) {
        console.error("Failed to load queued players count:", error);
      }
    };

    loadQueuedCount();

    return () => {
      subscription?.unsubscribe();
    };
  }, [playerName, teamId, gameId, navigate]);

  if (!playerName || !teamId) {
    return null;
  }

  const team = TEAMS[teamId as keyof typeof TEAMS];
  const teamColor = TEAM_COLORS[teamId as keyof typeof TEAM_COLORS];

  const getStatusMessage = () => {
    switch (gameStatus) {
      case "active":
        return "Game in progress";
      case "paused":
        return "Game paused";
      case "finished":
        return "Game finishing up...";
      default:
        return "Waiting for game";
    }
  };

  const getStatusIcon = () => {
    switch (gameStatus) {
      case "active":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "paused":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "finished":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-md space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <Users className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">You're Queued!</h1>
          </div>
          <div className="text-xl text-gray-600">
            Hello, <span className="font-semibold text-indigo-600">{playerName}</span>
          </div>
        </div>

        {/* Team Assignment */}
        <Card className="p-6">
          <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
            Your Team Assignment
          </h2>
          
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
              <div className="text-sm text-gray-500">{team.meaning}</div>
            </div>
          </div>
        </Card>

        {/* Game Status */}
        <Card className="p-6">
          <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
            Current Game Status
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {getStatusIcon()}
              <span className="font-medium text-gray-900">{getStatusMessage()}</span>
            </div>
            
            {gameStatus === "active" && (
              <div className="text-center">
                <div className="text-sm text-gray-600">Currently on</div>
                <div className="text-lg font-bold text-indigo-600">
                  Question {currentQuestion}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-center">
                <div className="text-sm text-gray-600">Game Code</div>
                <div className="text-xl font-bold tracking-wider text-gray-900">
                  {gameCode}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Queue Info */}
        <Card className="p-6">
          <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
            Queue Information
          </h2>
          
          <div className="space-y-3">
            {queuedCount > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {queuedCount} players queued for next round
                </span>
              </div>
            )}
            
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                What happens next?
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div>• You'll automatically join when this game ends</div>
                <div>• Your team will get credit for future questions</div>
                <div>• You won't get points for questions already asked</div>
                <div>• Wait here - you'll be redirected automatically!</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Alternative Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => navigate("/new-game", {
              state: {
                playerName,
                team: teamId,
                fromError: true
              }
            })}
            className="w-full"
          >
            Join Different Game Instead
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Return to Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Queue;