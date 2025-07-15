
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/game/Timer';
import { QuestionCard } from '@/components/game/QuestionCard';
import { GameHeader } from '@/components/game/GameHeader';
import { AnswerReveal } from '@/components/game/AnswerReveal';
import { TeamStatus } from '@/components/game/TeamStatus';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';
import { sampleQuestions } from '@/utils/sampleData';
import { useGameState } from '@/hooks/useGameState';
import { useGameTimer } from '@/hooks/useGameTimer';

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, team: teamId } = location.state || {};
  
  const gameState = useGameState(playerName, teamId);
  const { timeRemaining, resetTimer } = useGameTimer(
    60, 
    gameState.phase === 'question' && !gameState.hasSubmitted,
    gameState.handleTimeUp
  );
  
  useEffect(() => {
    if (!playerName || !teamId) {
      navigate('/');
      return;
    }
  }, [playerName, teamId, navigate]);

  useEffect(() => {
    if (gameState.phase === 'question') {
      resetTimer(60);
    }
  }, [gameState.currentQuestionIndex, gameState.phase, resetTimer]);

  const team = TEAMS[teamId as keyof typeof TEAMS];
  
  if (!team || !gameState.currentQuestion) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto py-4 space-y-4">
        {/* Header with Team Indicator */}
        <GameHeader
          team={team}
          playerName={playerName}
          currentQuestionIndex={gameState.currentQuestionIndex}
          totalQuestions={sampleQuestions.length}
          teamScore={gameState.scores[teamId as keyof typeof gameState.scores]}
        />

        {/* Timer */}
        {gameState.phase === 'question' && (
          <Timer timeRemaining={timeRemaining} totalTime={60} />
        )}

        {/* Question with larger text */}
        {gameState.phase === 'question' && (
          <QuestionCard
            question={gameState.currentQuestion}
            selectedAnswer={gameState.selectedAnswer}
            onAnswerSelect={gameState.handleAnswerSelect}
            hasSubmitted={gameState.hasSubmitted}
            teamColor={TEAM_COLORS[team.id as keyof typeof TEAM_COLORS]}
          />
        )}

        {/* Submit Button */}
        {gameState.phase === 'question' && gameState.selectedAnswer && !gameState.hasSubmitted && (
          <Button
            onClick={gameState.handleSubmitAnswer}
            className="w-full min-h-[60px] text-lg font-semibold px-6 py-4"
            style={{ backgroundColor: TEAM_COLORS[team.id as keyof typeof TEAM_COLORS] }}
          >
            Submit Answer
          </Button>
        )}

        {/* Team Status - Show teammates who have answered */}
        {gameState.hasSubmitted && gameState.phase === 'question' && (
          <TeamStatus
            team={team}
            selectedAnswer={gameState.selectedAnswer}
            teamMates={gameState.teamMates}
          />
        )}

        {/* Enhanced Answer Reveal */}
        {gameState.phase === 'answer-reveal' && (
          <AnswerReveal
            currentQuestion={gameState.currentQuestion}
            selectedAnswer={gameState.selectedAnswer}
            scores={gameState.scores}
            currentTeam={teamId}
            currentQuestionIndex={gameState.currentQuestionIndex}
            totalQuestions={sampleQuestions.length}
            onNextQuestion={gameState.handleNextQuestion}
          />
        )}
      </div>
    </div>
  );
};

export default Game;
