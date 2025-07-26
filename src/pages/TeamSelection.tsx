import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star, Users } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";

const TeamSelection = () => {
  const navigate = useNavigate();

  const handleTeamSelect = (teamId: string) => {
    navigate(`/?team=${teamId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8 space-y-4 text-center">
          <div className="flex justify-center">
            <Star className="h-16 w-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Eastern Star Trivia
          </h1>
          <p className="text-xl text-gray-600">
            Choose your star point to begin
          </p>
        </div>

        {/* Team Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(TEAMS).map((team) => (
            <Card
              key={team.id}
              className="min-h-[120px] cursor-pointer space-y-4 p-6 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg"
              onClick={() => handleTeamSelect(team.id)}
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
                style={{ backgroundColor: TEAM_COLORS[team.id] }}
              >
                <Star className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                <p className="text-lg text-gray-600">{team.heroine}</p>
                <div
                  className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium text-white"
                  style={{ backgroundColor: TEAM_COLORS[team.id] }}
                >
                  {team.meaning}
                </div>
              </div>

              <div className="flex items-center justify-center text-sm text-gray-500">
                <Users className="mr-1 h-4 w-4" />
                <span>0 members</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            Scan the QR code at your table to join your team directly
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamSelection;
