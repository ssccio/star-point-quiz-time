import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, Users } from "lucide-react";
import { TEAMS } from "@/utils/constants";

const Practice = () => {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const handleTeamSelect = (teamKey: string) => {
    setSelectedTeam(teamKey);
  };

  const handleStartPractice = () => {
    if (selectedTeam) {
      navigate("/game", {
        state: {
          mode: "practice",
          team: selectedTeam,
          playerName: "Practice Player",
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-3 py-8 text-center">
          <Star className="mx-auto h-16 w-16 text-emerald-600" />
          <h1 className="text-4xl font-bold text-gray-900">Practice Mode</h1>
          <p className="text-lg text-gray-600">
            Test your Eastern Star knowledge solo
          </p>
        </div>

        {/* Team Selection */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Choose Your Team</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(TEAMS).map(([key, team]) => (
                <button
                  key={key}
                  onClick={() => handleTeamSelect(key)}
                  className={`rounded-lg border-2 p-6 transition-all ${
                    selectedTeam === key
                      ? "scale-105 border-opacity-100 shadow-lg"
                      : "border-opacity-30 hover:border-opacity-60"
                  }`}
                  style={{
                    backgroundColor: `${team.color}15`,
                    borderColor: team.color,
                  }}
                >
                  <div className="space-y-2">
                    <div
                      className="mx-auto h-12 w-12 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <h3 className="text-lg font-bold">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.heroineTitle}</p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: team.color }}
                    >
                      {team.meaning}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleStartPractice}
                disabled={!selectedTeam}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <Users className="mr-2 h-4 w-4" />
                Start Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Practice;
