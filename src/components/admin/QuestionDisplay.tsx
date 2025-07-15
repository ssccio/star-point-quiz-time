import { Card } from '@/components/ui/card';

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

interface QuestionDisplayProps {
  currentQuestion: number;
  question: Question;
}

export const QuestionDisplay = ({ currentQuestion, question }: QuestionDisplayProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Current Question</h2>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-2">Question {currentQuestion + 1}</div>
          <div className="text-lg font-medium text-gray-900">
            {question?.text || 'No question loaded'}
          </div>
        </div>
        
        {question?.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              const isCorrect = option === question.correctAnswer;
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-bold mr-2">{letter}.</span>
                  <span>{option}</span>
                  {isCorrect && <span className="ml-2 text-green-600 font-bold">✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};