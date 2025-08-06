import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star, Book, ArrowLeft, User } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { getAvailableQuestionSets } from "@/utils/questionLoader";

const PracticeSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("team");
  const [selectedQuestionSet, setSelectedQuestionSet] = useState("");
  const [playerName, setPlayerName] = useState("");

  const team = teamId ? TEAMS[teamId as keyof typeof TEAMS] : null;
  const questionSets = getAvailableQuestionSets();

  if (!team) {
    navigate("/teams");
    return null;
  }

  const handleStartPractice = () => {
    if (!selectedQuestionSet || !playerName.trim()) return;

    // Navigate to game with practice parameters
    navigate(
      `/game?mode=practice&team=${teamId}&questionSet=${selectedQuestionSet}&player=${encodeURIComponent(playerName)}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-2xl py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/teams")}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Choose Different Team
        </Button>

        {/* Header */}
        <div className="mb-8 space-y-4 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
            style={{ backgroundColor: TEAM_COLORS[team.id] }}
          >
            <Star className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Practice Setup - {team.name}
          </h1>
          <p className="text-lg text-gray-600">
            {team.heroine} • {team.meaning}
          </p>
          <p className="text-sm text-gray-500">
            Perfect for preparing for meeting night trivia!
          </p>
        </div>

        <div className="space-y-6">
          {/* Player Name Input */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Information
                </h3>
              </div>
              <div>
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          {/* Question Set Selection */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Book className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Choose Question Set
                </h3>
              </div>
              <div className="space-y-3">
                {questionSets.map((set) => (
                  <Card
                    key={set.id}
                    className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                      selectedQuestionSet === set.id
                        ? "border-2 bg-blue-50"
                        : "border"
                    }`}
                    style={{
                      borderColor:
                        selectedQuestionSet === set.id
                          ? TEAM_COLORS[team.id]
                          : undefined,
                    }}
                    onClick={() => setSelectedQuestionSet(set.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <div
                          className={`h-4 w-4 rounded-full border-2 ${
                            selectedQuestionSet === set.id
                              ? "bg-current"
                              : "border-gray-300"
                          }`}
                          style={{
                            color:
                              selectedQuestionSet === set.id
                                ? TEAM_COLORS[team.id]
                                : undefined,
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {set.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {set.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>

          {/* Start Button */}
          <Button
            onClick={handleStartPractice}
            disabled={!selectedQuestionSet || !playerName.trim()}
            className="min-h-[60px] w-full text-lg font-semibold"
            style={{
              backgroundColor: TEAM_COLORS[team.id],
            }}
          >
            Start Practice Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSetup;
