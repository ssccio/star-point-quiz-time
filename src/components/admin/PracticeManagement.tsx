import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Download,
  Calendar,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import {
  practiceService,
  PracticeSession,
  PracticeSignup,
} from "@/lib/practiceService";
import { toast } from "sonner";

export const PracticeManagement = () => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [signups, setSignups] = useState<PracticeSignup[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalSessions: 0,
    totalPlayers: 0,
    averageAccuracy: 0,
    mostActiveTeam: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSessions(practiceService.getSessions());
    setSignups(practiceService.getSignups());
    setOverallStats(practiceService.getOverallStats());
  };

  const exportSessions = () => {
    try {
      const csv = practiceService.exportSessions();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `practice-sessions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Sessions exported successfully");
    } catch (error) {
      toast.error("Failed to export sessions");
    }
  };

  const exportSignups = () => {
    try {
      const csv = practiceService.exportSignups();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `practice-signups-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Signups exported successfully");
    } catch (error) {
      toast.error("Failed to export signups");
    }
  };

  const toggleAttendance = (signupId: string, attended: boolean) => {
    practiceService.markAttendance(signupId, attended);
    loadData();
    toast.success(`Attendance ${attended ? "marked" : "unmarked"}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTeamName = (teamId: string) => {
    return TEAMS[teamId as keyof typeof TEAMS]?.name || teamId;
  };

  const recentSessions = sessions
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
    .slice(0, 10);

  const pendingSignups = signups.filter((s) => !s.attended);

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card className="p-6">
        <div className="mb-6 flex items-center space-x-3">
          <Trophy className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Practice Overview</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {overallStats.totalSessions}
            </div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {overallStats.totalPlayers}
            </div>
            <div className="text-sm text-gray-600">Unique Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {overallStats.averageAccuracy}%
            </div>
            <div className="text-sm text-gray-600">Average Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {overallStats.mostActiveTeam
                ? getTeamName(overallStats.mostActiveTeam)
                : "N/A"}
            </div>
            <div className="text-sm text-gray-600">Most Active Team</div>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <Button onClick={exportSessions} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Sessions
          </Button>
          <Button onClick={exportSignups} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Signups
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Practice Sessions */}
        <Card className="p-6">
          <div className="mb-6 flex items-center space-x-3">
            <Users className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Practice Sessions
            </h3>
          </div>

          {recentSessions.length === 0 ? (
            <p className="py-4 text-center text-gray-500">
              No practice sessions yet
            </p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{
                            backgroundColor: TEAM_COLORS[session.teamId],
                          }}
                        />
                        <span className="font-medium">
                          {session.playerName}
                        </span>
                        <Badge variant="outline">
                          {getTeamName(session.teamId)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {session.questionSetTitle}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(session.startTime)}
                        {session.duration && ` • ${session.duration} min`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {session.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            session.accuracy >= 80
                              ? "text-green-600"
                              : session.accuracy >= 60
                                ? "text-blue-600"
                                : "text-orange-600"
                          }`}
                        >
                          {session.accuracy}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {session.correctAnswers}/{session.totalQuestions}{" "}
                        correct
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Practice Signups */}
        <Card className="p-6">
          <div className="mb-6 flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Practice Signups ({pendingSignups.length} pending)
            </h3>
          </div>

          {signups.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No signups yet</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {signups
                .sort(
                  (a, b) =>
                    new Date(b.signupTime).getTime() -
                    new Date(a.signupTime).getTime()
                )
                .map((signup) => (
                  <div
                    key={signup.id}
                    className={`rounded-lg border p-4 ${
                      signup.attended ? "bg-green-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{
                              backgroundColor: TEAM_COLORS[signup.teamId],
                            }}
                          />
                          <span className="font-medium">
                            {signup.playerName}
                          </span>
                          <Badge variant="outline">
                            {getTeamName(signup.teamId)}
                          </Badge>
                          {signup.attended && (
                            <Badge className="bg-green-100 text-green-800">
                              Attended
                            </Badge>
                          )}
                        </div>
                        {signup.email && (
                          <p className="mt-1 text-sm text-gray-600">
                            {signup.email}
                          </p>
                        )}
                        {signup.preferredTime && (
                          <p className="mt-1 text-sm text-gray-600">
                            Preferred: {signup.preferredTime}
                          </p>
                        )}
                        {signup.notes && (
                          <p className="mt-1 text-sm italic text-gray-600">
                            "{signup.notes}"
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Signed up: {formatDate(signup.signupTime)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={signup.attended ? "outline" : "default"}
                        onClick={() =>
                          toggleAttendance(signup.id, !signup.attended)
                        }
                        className="ml-4"
                      >
                        {signup.attended
                          ? "Mark Not Attended"
                          : "Mark Attended"}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Team Statistics */}
      <Card className="p-6">
        <div className="mb-6 flex items-center space-x-3">
          <Star className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Team Performance
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {Object.values(TEAMS).map((team) => {
            const teamStats = practiceService.getTeamStats(team.id);
            return (
              <div
                key={team.id}
                className="rounded-lg border-2 p-4 text-center"
                style={{ borderColor: TEAM_COLORS[team.id] + "40" }}
              >
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: TEAM_COLORS[team.id] }}
                >
                  <Star className="h-6 w-6" />
                </div>
                <h4 className="mb-2 font-semibold text-gray-900">
                  {team.name}
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {teamStats.totalSessions}
                    </span>
                    <div className="text-gray-600">Sessions</div>
                  </div>
                  <div>
                    <span
                      className="text-lg font-semibold"
                      style={{ color: TEAM_COLORS[team.id] }}
                    >
                      {teamStats.averageAccuracy}%
                    </span>
                    <div className="text-gray-600">Avg Accuracy</div>
                  </div>
                  <div className="text-gray-600">
                    {teamStats.totalPlayers} players
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
