import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trophy, Medal, Award } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);

  const {
    playerName,
    team: teamId,
    finalScores,
    practiceMode = false,
    practiceStats,
    totalQuestions,
  } = location.state || {};

  useEffect(() => {
    if (!playerName || !teamId) {
      navigate("/");
      return;
    }

    // For multiplayer mode, require finalScores
    if (!practiceMode && !finalScores) {
      navigate("/");
      return;
    }

    // For practice mode, require practiceStats
    if (practiceMode && !practiceStats) {
      navigate("/");
      return;
    }

    // Trigger animation after component mounts
    setTimeout(() => setShowAnimation(true), 500);
  }, [playerName, teamId, finalScores, practiceMode, practiceStats, navigate]);

  if ((!practiceMode && !finalScores) || (practiceMode && !practiceStats)) {
    navigate("/");
    return null;
  }

  const playerTeam = TEAMS[teamId];

  // For multiplayer mode, convert scores to sorted array
  let sortedTeams: Array<{
    id: string;
    name: string;
    heroine: string;
    meaning: string;
    score: number;
  }> = [];
  let playerRank = 1;

  if (!practiceMode && finalScores) {
    sortedTeams = Object.entries(finalScores)
      .map(([id, score]) => ({
        ...TEAMS[id],
        score: score as number,
      }))
      .sort((a, b) => b.score - a.score);

    playerRank = sortedTeams.findIndex((team) => team.id === teamId) + 1;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-6 w-6 text-gray-400" />;
    }
  };

  const handleJoinAnotherGame = () => {
    navigate("/new-game", {
      state: {
        playerName,
        team: teamId,
        finalScores,
        playerRank,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            {practiceMode ? "Practice Complete!" : "Game Complete!"}
          </h1>
          <p className="text-xl text-gray-600">
            {practiceMode ? "Your Results" : "Final Rankings"}
          </p>
        </div>

        {/* Player's Result */}
        <Card className="p-6">
          <div className="space-y-4 text-center">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
              style={{ backgroundColor: TEAM_COLORS[playerTeam.id] }}
            >
              <Star className="h-10 w-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Team {playerTeam.name}
              </h2>
              <p className="text-lg text-gray-600">{playerTeam.heroine}</p>

              {practiceMode && practiceStats ? (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-center space-x-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {practiceStats.correctAnswers}
                      </div>
                      <div className="text-sm text-gray-500">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {Math.round(
                          (practiceStats.correctAnswers /
                            Math.max(practiceStats.totalAnswered, 1)) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-sm text-gray-500">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {practiceStats.bestStreak}
                      </div>
                      <div className="text-sm text-gray-500">Best Streak</div>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    Answered {practiceStats.totalAnswered} of {totalQuestions}{" "}
                    questions
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {finalScores?.[teamId] || 0}
                  </span>
                  <span className="ml-2 text-lg text-gray-500">points</span>
                  <div className="mt-2 flex items-center justify-center">
                    {getRankIcon(playerRank)}
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      {playerRank === 1
                        ? "1st Place!"
                        : playerRank === 2
                          ? "2nd Place!"
                          : playerRank === 3
                            ? "3rd Place!"
                            : `${playerRank}th Place`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Leaderboard - only show for multiplayer games */}
        {!practiceMode && sortedTeams.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 text-center text-xl font-bold text-gray-900">
              Final Leaderboard
            </h3>
            <div className="space-y-3">
              {sortedTeams.map((team, index) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between rounded-lg p-4 transition-all duration-500 ${
                    showAnimation
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  } ${team.id === teamId ? "border-2 border-blue-200 bg-blue-50" : "bg-gray-50"}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(index + 1)}
                      <span className="text-lg font-bold text-gray-900">
                        #{index + 1}
                      </span>
                    </div>

                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                      style={{ backgroundColor: TEAM_COLORS[team.id] }}
                    >
                      <Star className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900">
                        {team.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {team.heroine}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {team.score}
                    </div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Winner Celebration with Animation - only show for multiplayer games */}
        {!practiceMode && playerRank === 1 && (
          <Card className="relative overflow-hidden border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-6">
            <div className="relative z-10 space-y-3 text-center">
              <div className="animate-bounce text-6xl">🎉</div>
              <h3 className="text-2xl font-bold text-amber-800">
                Congratulations!
              </h3>
              <p className="text-amber-700">Team {playerTeam.name} wins!</p>
              <div className="text-4xl">🏆👑🌟</div>
            </div>
            {/* Animated confetti effect */}
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="absolute h-2 w-2 animate-ping rounded-full bg-yellow-400"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Practice Mode Celebration */}
        {practiceMode &&
          practiceStats &&
          practiceStats.correctAnswers / practiceStats.totalAnswered >= 0.8 && (
            <Card className="relative overflow-hidden border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <div className="relative z-10 space-y-3 text-center">
                <div className="animate-bounce text-6xl">🌟</div>
                <h3 className="text-2xl font-bold text-green-800">
                  Great Job!
                </h3>
                <p className="text-green-700">
                  {Math.round(
                    (practiceStats.correctAnswers /
                      practiceStats.totalAnswered) *
                      100
                  )}
                  % accuracy - Keep up the excellent work!
                </p>
                <div className="text-4xl">📚✨💫</div>
              </div>
            </Card>
          )}

        {/* Actions */}
        <div className="space-y-3">
          {practiceMode ? (
            <>
              <Button
                onClick={() =>
                  navigate("/teams", { state: { practiceMode: true } })
                }
                className="min-h-[60px] w-full bg-indigo-600 px-6 py-4 text-lg font-semibold hover:bg-indigo-700"
              >
                Practice Again
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="min-h-[60px] w-full px-6 py-4 text-lg font-semibold"
              >
                Return to Main Menu
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleJoinAnotherGame}
                className="min-h-[60px] w-full bg-indigo-600 px-6 py-4 text-lg font-semibold hover:bg-indigo-700"
              >
                Join Another Game
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="min-h-[60px] w-full px-6 py-4 text-lg font-semibold"
              >
                Return to Main Menu
              </Button>
            </>
          )}
        </div>

        {/* Thank You */}
        <div className="space-y-2 text-center text-gray-500">
          <p className="text-lg">Thank you for playing!</p>
          <p className="text-sm">Eastern Star Trivia Game</p>
        </div>
      </div>
    </div>
  );
};

export default Results;
