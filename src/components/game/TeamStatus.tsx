import { Card } from "@/components/ui/card";
import { TEAM_COLORS } from "@/utils/constants";
import { TeamMate } from "@/hooks/useGameState";

interface Team {
  id: string;
  name: string;
  heroine: string;
  meaning: string;
  color: string;
}

interface TeamStatusProps {
  team: Team;
  selectedAnswer: string | null;
  teamMates: TeamMate[];
}

export const TeamStatus = ({
  team,
  selectedAnswer,
  teamMates,
}: TeamStatusProps) => {
  return (
    <Card className="p-6 text-center">
      <div className="space-y-4">
        <div className="text-lg font-semibold text-green-600">
          Answer Submitted!
        </div>
        <p className="text-gray-600">Waiting for other players...</p>
        <div
          className="inline-block rounded-full px-4 py-2 font-medium text-white"
          style={{
            backgroundColor: TEAM_COLORS[team.id as keyof typeof TEAM_COLORS],
          }}
        >
          Your answer: {selectedAnswer}
        </div>

        {/* Teammates Status */}
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-500">Team {team.name} Status:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {teamMates.map((mate, index) => (
              <div
                key={index}
                className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs ${
                  mate.hasAnswered
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span>{mate.name}</span>
                {mate.hasAnswered && <span>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
