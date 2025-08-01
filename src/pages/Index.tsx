import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Crown, Star } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamParam = searchParams.get("team");

  // If team parameter is provided, go directly to practice game
  useEffect(() => {
    if (teamParam) {
      navigate(`/game?mode=practice&team=${teamParam}`);
    }
  }, [teamParam, navigate]);

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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Host Multiplayer Game */}
          <Card
            className="cursor-pointer p-8 text-center transition-shadow hover:shadow-lg"
            onClick={() => navigate("/host")}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <Crown className="h-16 w-16 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Host a Game</h2>
              <p className="text-gray-600">
                Create a multiplayer quiz session for your Eastern Star meeting.
                Generate a QR code for others to join.
              </p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Host Game
              </Button>
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
