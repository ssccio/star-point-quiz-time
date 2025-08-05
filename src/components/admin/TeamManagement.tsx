import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";

interface TeamData {
  count: number;
  connected: number;
  names: string[];
  queuedCount?: number;
  queuedNames?: string[];
}

interface TeamManagementProps {
  players: Record<string, TeamData>;
  scores: Record<string, number>;
  onAdjustScore: (teamId: string, amount: number) => void;
}

export const TeamManagement = ({
  players,
  scores,
  onAdjustScore,
}: TeamManagementProps) => {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Team Management</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Object.entries(TEAMS).map(([teamId, team]) => {
          const teamData = players[teamId];
          const teamScore = scores[teamId];

          return (
            <Card key={teamId} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white"
                    style={{
                      backgroundColor:
                        TEAM_COLORS[teamId as keyof typeof TEAM_COLORS],
                    }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {team.name}
                    </div>
                    <div className="text-sm text-gray-500">{team.heroine}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {teamScore} pts
                  </div>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        teamData.connected === teamData.count
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    <span className="text-sm text-gray-500">
                      {teamData.connected}/{teamData.count} online
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {/* Active Players */}
                <div>
                  <div className="mb-1 text-xs font-medium text-gray-600">
                    Active Players
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {teamData.names.map((name, index) => (
                      <Badge
                        key={index}
                        variant={
                          index < teamData.connected ? "default" : "outline"
                        }
                        className="text-xs"
                      >
                        {name}
                        {index >= teamData.connected && (
                          <AlertTriangle className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                    {teamData.names.length === 0 && (
                      <span className="text-xs text-gray-400">
                        No active players
                      </span>
                    )}
                  </div>
                </div>

                {/* Queued Players */}
                {teamData.queuedCount && teamData.queuedCount > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-orange-600">
                      Queued Players ({teamData.queuedCount})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {teamData.queuedNames?.map((name, index) => (
                        <Badge
                          key={`queued-${index}`}
                          variant="secondary"
                          className="border-orange-300 bg-orange-100 text-xs text-orange-800"
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => onAdjustScore(teamId, 10)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  +10
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAdjustScore(teamId, -10)}
                  variant="destructive"
                >
                  -10
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAdjustScore(teamId, 20)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  +20 Bonus
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
