import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Star, Loader2, BookOpen, Trophy } from "lucide-react";
import { toast } from "sonner";
import { gameService } from "@/lib/gameService";

const Index = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = async () => {
    const code = gameCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a game code");
      return;
    }

    if (code.length !== 3) {
      toast.error("Game code must be 3 characters");
      return;
    }

    setIsJoining(true);
    try {
      // Check if game exists
      const game = await gameService.getGame(code);
      if (!game) {
        toast.error("Game not found - please check the code");
        return;
      }

      // Navigate to simplified join page
      navigate(`/join/${code}`);
    } catch (error) {
      console.error("Error checking game:", error);
      toast.error("Error finding game - please try again");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="mx-auto w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Star className="h-16 w-16 animate-pulse text-indigo-600" />
          </div>
          <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent">
            Eastern Star Quiz
          </h1>
          <p className="text-lg text-gray-600">Join the trivia challenge!</p>
        </div>

        {/* Main Join Card */}
        <Card className="border-0 bg-white/95 shadow-xl backdrop-blur">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="text-center text-2xl font-semibold">
                Enter Game Code
              </h2>
              <p className="text-center text-sm text-gray-500">
                Your host will provide a 3-letter code
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="ABC"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength={3}
                className="h-16 text-center text-3xl font-bold tracking-widest text-indigo-600"
                onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                disabled={isJoining}
              />

              <Button
                onClick={handleJoinGame}
                disabled={!gameCode.trim() || isJoining}
                className="h-14 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-lg font-semibold hover:from-indigo-700 hover:to-purple-700"
                size="lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-5 w-5" />
                    Join Game
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Links */}
        <div className="flex justify-center space-x-6 text-sm">
          <button
            onClick={() => navigate("/practice")}
            className="flex items-center text-gray-600 transition-colors hover:text-indigo-600"
          >
            <BookOpen className="mr-1 h-4 w-4" />
            Practice Mode
          </button>
          <button
            onClick={() => navigate("/host")}
            className="flex items-center text-gray-600 transition-colors hover:text-indigo-600"
          >
            <Trophy className="mr-1 h-4 w-4" />
            Host a Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
