import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/game/Timer";
import { QuestionCard } from "@/components/game/QuestionCard";
import { GameHeader } from "@/components/game/GameHeader";
import { AnswerReveal } from "@/components/game/AnswerReveal";
import { TeamStatus } from "@/components/game/TeamStatus";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { useGameState } from "@/hooks/useGameState";
import { useGameTimer } from "@/hooks/useGameTimer";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if this is practice mode
  const mode = searchParams.get("mode");
  const isPracticeMode = mode === "practice";

  // Get player data from either URL params (practice) or location state (multiplayer)
  const teamId = isPracticeMode
    ? searchParams.get("team")
    : location.state?.team;
  const playerName = isPracticeMode
    ? "Practice Player"
    : location.state?.playerName;

  // Get game context for multiplayer mode
  const gameData = !isPracticeMode
    ? JSON.parse(localStorage.getItem("gameData") || "{}")
    : {};
  const gameId = !isPracticeMode ? gameData.gameId : undefined;
  const playerId = !isPracticeMode ? gameData.playerId : undefined;

  const gameState = useGameState(
    playerName,
    teamId,
    isPracticeMode,
    gameId,
    playerId
  );
  const { timeRemaining, resetTimer } = useGameTimer(
    60,
    gameState.phase === "question" && !gameState.hasSubmitted,
    gameState.handleTimeUp
  );

  useEffect(() => {
    if (!playerName || !teamId) {
      navigate("/");
      return;
    }
  }, [playerName, teamId, navigate]);

  useEffect(() => {
    if (gameState.phase === "question") {
      resetTimer(60);
    }
  }, [gameState.currentQuestionIndex, gameState.phase, resetTimer]);

  const team = TEAMS[teamId as keyof typeof TEAMS];

  if (!team || !gameState.currentQuestion) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-2xl space-y-4 py-4">
        {/* Header with Team Indicator */}
        <GameHeader
          team={team}
          playerName={playerName}
          currentQuestionIndex={gameState.currentQuestionIndex}
          totalQuestions={gameState.questions.length}
          teamScore={
            isPracticeMode
              ? Math.round(
                  (gameState.practiceStats.correctAnswers /
                    Math.max(gameState.practiceStats.totalAnswered, 1)) *
                    100
                )
              : 0 // For multiplayer games, don't show team scores during gameplay
          }
        />

        {/* Timer */}
        {gameState.phase === "question" && (
          <Timer timeRemaining={timeRemaining} totalTime={60} />
        )}

        {/* Question with larger text */}
        {gameState.phase === "question" && (
          <QuestionCard
            question={gameState.currentQuestion}
            selectedAnswer={gameState.selectedAnswer}
            onAnswerSelect={gameState.handleAnswerSelect}
            hasSubmitted={gameState.hasSubmitted}
            teamColor={TEAM_COLORS[team.id as keyof typeof TEAM_COLORS]}
          />
        )}

        {/* Submit Button */}
        {gameState.phase === "question" &&
          gameState.selectedAnswer &&
          !gameState.hasSubmitted && (
            <Button
              onClick={gameState.handleSubmitAnswer}
              className="min-h-[60px] w-full px-6 py-4 text-lg font-semibold"
              style={{
                backgroundColor:
                  TEAM_COLORS[team.id as keyof typeof TEAM_COLORS],
              }}
            >
              Submit Answer
            </Button>
          )}

        {/* Team Status - Show teammates who have answered (only in multiplayer) */}
        {!isPracticeMode &&
          gameState.hasSubmitted &&
          gameState.phase === "question" && (
            <TeamStatus
              team={team}
              selectedAnswer={gameState.selectedAnswer}
              teamMates={gameState.teamMates}
            />
          )}

        {/* Practice Mode Progress - Show encouraging stats */}
        {isPracticeMode &&
          gameState.hasSubmitted &&
          gameState.phase === "question" && (
            <div className="rounded-lg border border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-2 text-sm text-gray-600">Your Progress</div>
                <div className="flex justify-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {gameState.practiceStats.correctAnswers}
                    </div>
                    <div className="text-xs text-gray-500">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(
                        (gameState.practiceStats.correctAnswers /
                          Math.max(gameState.practiceStats.totalAnswered, 1)) *
                          100
                      )}
                      %
                    </div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {gameState.practiceStats.currentStreak}
                    </div>
                    <div className="text-xs text-gray-500">Streak</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Enhanced Answer Reveal */}
        {gameState.phase === "answer-reveal" && (
          <AnswerReveal
            currentQuestion={gameState.currentQuestion}
            selectedAnswer={gameState.selectedAnswer}
            scores={undefined} // Don't show team scores during multiplayer gameplay
            currentTeam={teamId}
            currentQuestionIndex={gameState.currentQuestionIndex}
            totalQuestions={gameState.questions.length}
            onNextQuestion={gameState.handleNextQuestion}
            isPracticeMode={isPracticeMode}
            practiceStats={isPracticeMode ? gameState.practiceStats : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default Game;
