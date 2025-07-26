import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Star, Users } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";

interface LandingProps {
  preselectedTeam?: string;
}

const Landing = ({ preselectedTeam }: LandingProps) => {
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const team = preselectedTeam ? TEAMS[preselectedTeam] : null;

  const handleJoinGame = async () => {
    if (!playerName.trim() || playerName.length < 2) return;

    setIsJoining(true);

    // Simulate joining process
    setTimeout(() => {
      navigate("/lobby", {
        state: {
          playerName: playerName.trim(),
          team: preselectedTeam,
          email: email.trim() || undefined,
        },
      });
    }, 1000);
  };

  if (!team) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md space-y-6 p-8">
        {/* Team Header */}
        <div className="space-y-4 text-center">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: TEAM_COLORS[team.id] }}
          >
            <Star className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-lg text-gray-600">{team.heroine}</p>
            <p className="mt-1 text-sm text-gray-500">Team {team.name}</p>
          </div>
        </div>

        {/* Join Form */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              First Name & Last Initial *
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John D."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="h-12 text-lg"
              maxLength={20}
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 2 characters required
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email (Optional)
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
          </div>

          <Button
            onClick={handleJoinGame}
            disabled={playerName.trim().length < 2 || isJoining}
            className="min-h-[60px] w-full px-6 py-4 text-lg font-semibold"
            style={{
              backgroundColor:
                playerName.trim().length >= 2
                  ? TEAM_COLORS[team.id]
                  : undefined,
            }}
          >
            {isJoining ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                Joining Game...
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                Join Game
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="space-y-1 text-center text-sm text-gray-500">
          <p>You'll join the {team.name} team</p>
          <p>Get ready for Eastern Star trivia!</p>
        </div>
      </Card>
    </div>
  );
};

export default Landing;
