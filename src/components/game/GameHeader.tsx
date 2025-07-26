import { Card } from "@/components/ui/card";
import { TEAM_COLORS } from "@/utils/constants";

interface Team {
  id: string;
  name: string;
  heroine: string;
  meaning: string;
  color: string;
}

interface GameHeaderProps {
  team: Team;
  playerName: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  teamScore: number;
}

export const GameHeader = ({
  team,
  playerName,
  currentQuestionIndex,
  totalQuestions,
  teamScore,
}: GameHeaderProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{
              backgroundColor: TEAM_COLORS[team.id as keyof typeof TEAM_COLORS],
            }}
          >
            {team.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900">Team {team.name}</div>
            <div className="text-sm text-gray-500">{playerName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
          <div className="text-sm text-gray-500">Score: {teamScore}</div>
        </div>
      </div>
    </Card>
  );
};
