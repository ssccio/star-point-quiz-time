import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScoreBoard } from './ScoreBoard';
import { TeamScores } from '@/hooks/useGameState';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface AnswerRevealProps {
  currentQuestion: Question;
  selectedAnswer: string | null;
  scores?: TeamScores;
  currentTeam: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  isPracticeMode?: boolean;
  practiceStats?: {
    correctAnswers: number;
    totalAnswered: number;
    currentStreak: number;
    bestStreak: number;
  };
}

export const AnswerReveal = ({
  currentQuestion,
  selectedAnswer,
  scores,
  currentTeam,
  currentQuestionIndex,
  totalQuestions,
  onNextQuestion,
  isPracticeMode = false,
  practiceStats
}: AnswerRevealProps) => {
  return (
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
                        ? 'bg-orange-50 border-orange-400 text-orange-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold px-2 py-1 rounded ${
                      isCorrect ? 'bg-green-200' : wasSelected ? 'bg-orange-200' : 'bg-gray-200'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-lg">{option}</span>
                    {isCorrect && <span className="text-green-600 font-bold">✓ CORRECT</span>}
                    {wasSelected && !isCorrect && <span className="text-orange-600 font-bold">→ YOUR ANSWER</span>}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700 font-medium">Explanation:</p>
            <p className="text-gray-600 mt-1">{currentQuestion.explanation}</p>
          </div>
          
          {/* Practice vs Competition feedback */}
          <div className="text-center">
            {isPracticeMode ? (
              selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="text-green-600 font-bold text-xl">
                  🎉 Excellent! You got it right!
                </div>
              ) : (
                <div className="text-blue-600 font-bold text-xl">
                  📚 Great learning opportunity!
                </div>
              )
            ) : (
              selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="text-green-600 font-bold text-xl">
                  ✓ Correct! +20 points
                </div>
              ) : (
                <div className="text-orange-600 font-bold text-xl">
                  → Not quite right this time
                </div>
              )
            )}
          </div>
        </div>
      </Card>

      {isPracticeMode && practiceStats ? (
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Learning Progress</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {practiceStats.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round((practiceStats.correctAnswers / Math.max(practiceStats.totalAnswered, 1)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {practiceStats.currentStreak}
                </div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </div>
            </div>
            {practiceStats.currentStreak >= 3 && (
              <div className="mt-3 text-sm text-green-600 font-medium">
                🔥 You're on fire! Keep it up!
              </div>
            )}
          </div>
        </Card>
      ) : scores ? (
        <ScoreBoard scores={scores} currentTeam={currentTeam} />
      ) : null}

      <Button
        onClick={onNextQuestion}
        className="w-full min-h-[60px] text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 px-6 py-4"
      >
        {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'View Final Results'}
      </Button>
    </div>
  );
};