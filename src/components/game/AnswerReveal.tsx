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
  scores: TeamScores;
  currentTeam: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
}

export const AnswerReveal = ({
  currentQuestion,
  selectedAnswer,
  scores,
  currentTeam,
  currentQuestionIndex,
  totalQuestions,
  onNextQuestion
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

      <ScoreBoard scores={scores} currentTeam={currentTeam} />

      <Button
        onClick={onNextQuestion}
        className="w-full min-h-[60px] text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 px-6 py-4"
      >
        {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'View Final Results'}
      </Button>
    </div>
  );
};