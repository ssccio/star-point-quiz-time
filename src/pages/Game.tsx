
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/game/Timer';
import { ScoreBoard } from '@/components/game/ScoreBoard';
import { QuestionCard } from '@/components/game/QuestionCard';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';
import { sampleQuestions } from '@/utils/sampleData';

type GamePhase = 'question' | 'answer-reveal' | 'leaderboard' | 'final-wager' | 'results';

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('question');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [scores, setScores] = useState({
    adah: 150,
    ruth: 180,
    esther: 120,
    martha: 160,
    electa: 140
  });

  const { playerName, team: teamId } = location.state || {};
  
  useEffect(() => {
    if (!playerName || !teamId) {
      navigate('/');
      return;
    }
  }, [playerName, teamId, navigate]);

  const team = TEAMS[teamId];
  const currentQuestion = sampleQuestions[currentQuestionIndex];
  
  if (!team || !currentQuestion) {
    navigate('/');
    return null;
  }

  const handleAnswerSelect = (answer: string) => {
    if (hasSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || hasSubmitted) return;
    setHasSubmitted(true);
    // Simulate processing time
    setTimeout(() => {
      setPhase('answer-reveal');
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setPhase('question');
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setTimeRemaining(60);
      
      // Update scores randomly for demo
      setScores(prev => ({
        adah: prev.adah + Math.floor(Math.random() * 30),
        ruth: prev.ruth + Math.floor(Math.random() * 30),
        esther: prev.esther + Math.floor(Math.random() * 30),
        martha: prev.martha + Math.floor(Math.random() * 30),
        electa: prev.electa + Math.floor(Math.random() * 30),
      }));
    } else {
      navigate('/results', { 
        state: { 
          playerName, 
          team: teamId, 
          finalScores: scores 
        } 
      });
    }
  };

  // Timer effect
  useEffect(() => {
    if (phase === 'question' && timeRemaining > 0 && !hasSubmitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !hasSubmitted) {
      setPhase('answer-reveal');
    }
  }, [phase, timeRemaining, hasSubmitted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto py-4 space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: TEAM_COLORS[team.id] }}
              >
                {team.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">Team {team.name}</div>
                <div className="text-sm text-gray-500">{playerName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {sampleQuestions.length}
              </div>
              <div className="text-sm text-gray-500">Score: {scores[teamId as keyof typeof scores]}</div>
            </div>
          </div>
        </Card>

        {/* Timer */}
        {phase === 'question' && (
          <Timer timeRemaining={timeRemaining} totalTime={60} />
        )}

        {/* Question */}
        {phase === 'question' && (
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            hasSubmitted={hasSubmitted}
            teamColor={TEAM_COLORS[team.id]}
          />
        )}

        {/* Submit Button */}
        {phase === 'question' && selectedAnswer && !hasSubmitted && (
          <Button
            onClick={handleSubmitAnswer}
            className="w-full h-14 text-lg font-semibold"
            style={{ backgroundColor: TEAM_COLORS[team.id] }}
          >
            Submit Answer
          </Button>
        )}

        {/* Answer Submitted State */}
        {hasSubmitted && phase === 'question' && (
          <Card className="p-6 text-center">
            <div className="space-y-3">
              <div className="text-green-600 font-semibold text-lg">Answer Submitted!</div>
              <p className="text-gray-600">Waiting for other players...</p>
              <div 
                className="inline-block px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: TEAM_COLORS[team.id] }}
              >
                Your answer: {selectedAnswer}
              </div>
            </div>
          </Card>
        )}

        {/* Answer Reveal */}
        {phase === 'answer-reveal' && (
          <div className="space-y-4">
            <Card className="p-6 text-center">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Correct Answer</h2>
                <div className="text-lg font-semibold text-green-600">
                  {currentQuestion.correctAnswer}
                </div>
                <p className="text-gray-600">{currentQuestion.explanation}</p>
                
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div className="text-green-600 font-semibold">
                    ✓ Correct! +20 points
                  </div>
                ) : (
                  <div className="text-red-600 font-semibold">
                    ✗ Incorrect. Your answer: {selectedAnswer}
                  </div>
                )}
              </div>
            </Card>

            <ScoreBoard scores={scores} currentTeam={teamId} />

            <Button
              onClick={handleNextQuestion}
              className="w-full h-14 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
            >
              {currentQuestionIndex < sampleQuestions.length - 1 ? 'Next Question' : 'View Final Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
