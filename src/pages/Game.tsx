
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
  
  console.log('Game component rendered:', { 
    locationState: location.state, 
    pathname: location.pathname 
  });
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
  
  console.log('Extracted state:', { playerName, teamId });
  
  const [teamMates, setTeamMates] = useState([
    { name: 'Alice M.', hasAnswered: false },
    { name: 'Bob K.', hasAnswered: false },
    { name: 'Carol R.', hasAnswered: true }
  ]);
  
  useEffect(() => {
    console.log('Game useEffect check:', { playerName, teamId });
    if (!playerName || !teamId) {
      console.log('Missing required state, redirecting to home');
      navigate('/');
      return;
    }
    console.log('State validation passed');
  }, [playerName, teamId, navigate]);

  const team = TEAMS[teamId];
  const currentQuestion = sampleQuestions[currentQuestionIndex];
  
  console.log('Team and question check:', { 
    teamId, 
    team, 
    currentQuestionIndex, 
    currentQuestion: !!currentQuestion 
  });
  
  if (!team || !currentQuestion) {
    console.log('Missing team or question, redirecting to home');
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
    
    // Mark player as answered
    setTeamMates(prev => prev.map(mate => 
      mate.name === playerName ? { ...mate, hasAnswered: true } : mate
    ));
    
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
      
      // Reset teammates answered status
      setTeamMates(prev => prev.map(mate => ({ ...mate, hasAnswered: false })));
      
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
        {/* Header with Team Indicator */}
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
              <div className="text-2xl font-bold text-gray-900">
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

        {/* Question with larger text */}
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
            className="w-full min-h-[60px] text-lg font-semibold px-6 py-4"
            style={{ backgroundColor: TEAM_COLORS[team.id] }}
          >
            Submit Answer
          </Button>
        )}

        {/* Team Status - Show teammates who have answered */}
        {hasSubmitted && phase === 'question' && (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div className="text-green-600 font-semibold text-lg">Answer Submitted!</div>
              <p className="text-gray-600">Waiting for other players...</p>
              <div 
                className="inline-block px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: TEAM_COLORS[team.id] }}
              >
                Your answer: {selectedAnswer}
              </div>
              
              {/* Teammates Status */}
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Team {team.name} Status:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {teamMates.map((mate, index) => (
                    <div 
                      key={index}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                        mate.hasAnswered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
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
        )}

        {/* Enhanced Answer Reveal */}
        {phase === 'answer-reveal' && (
          <div className="space-y-4">
            <Card className="p-6 text-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Time's Up!</h2>
                
                {/* Show all answers with correct/incorrect highlighting */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const letter = String.fromCharCode(65 + index);
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const wasSelected = option === selectedAnswer;
                    
                    return (
                      <div 
                        key={option}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrect 
                            ? 'bg-green-50 border-green-500 text-green-800' 
                            : wasSelected 
                              ? 'bg-red-50 border-red-500 text-red-800'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`font-bold px-2 py-1 rounded ${
                            isCorrect ? 'bg-green-200' : wasSelected ? 'bg-red-200' : 'bg-gray-200'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-lg">{option}</span>
                          {isCorrect && <span className="text-green-600 font-bold">✓ CORRECT</span>}
                          {wasSelected && !isCorrect && <span className="text-red-600 font-bold">✗ YOUR ANSWER</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700 font-medium">Explanation:</p>
                  <p className="text-gray-600 mt-1">{currentQuestion.explanation}</p>
                </div>
                
                {/* Points earned */}
                <div className="text-center">
                  {selectedAnswer === currentQuestion.correctAnswer ? (
                    <div className="text-green-600 font-bold text-xl">
                      ✓ Correct! +20 points
                    </div>
                  ) : (
                    <div className="text-red-600 font-bold text-xl">
                      ✗ Incorrect. No points earned
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <ScoreBoard scores={scores} currentTeam={teamId} />

            <Button
              onClick={handleNextQuestion}
              className="w-full min-h-[60px] text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 px-6 py-4"
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
