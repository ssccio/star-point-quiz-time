
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
  hasSubmitted: boolean;
  teamColor: string;
}

export const QuestionCard = ({ 
  question, 
  selectedAnswer, 
  onAnswerSelect, 
  hasSubmitted,
  teamColor 
}: QuestionCardProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Question Text */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 leading-relaxed">
            {question.text}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedAnswer === option;
            
            return (
              <Button
                key={option}
                variant={isSelected ? "default" : "outline"}
                className={`w-full h-auto p-4 text-left justify-start text-wrap min-h-[60px] ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  backgroundColor: isSelected ? teamColor : undefined,
                  borderColor: isSelected ? teamColor : undefined,
                  ringColor: isSelected ? teamColor : undefined,
                }}
                onClick={() => onAnswerSelect(option)}
                disabled={hasSubmitted}
              >
                <span className="flex items-start space-x-3 w-full">
                  <span className={`font-bold text-sm px-2 py-1 rounded ${
                    isSelected ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {letter}
                  </span>
                  <span className="text-base leading-relaxed flex-1">{option}</span>
                </span>
              </Button>
            );
          })}
        </div>

        {/* Instructions */}
        {!hasSubmitted && (
          <div className="text-center text-sm text-gray-500">
            {selectedAnswer ? 'Tap "Submit Answer" to confirm your choice' : 'Select an answer above'}
          </div>
        )}
      </div>
    </Card>
  );
};
