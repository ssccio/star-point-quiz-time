import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
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
  teamColor,
}: QuestionCardProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Question Text - Large font minimum 20px */}
        <div className="text-center">
          <h2 className="text-2xl font-bold leading-relaxed text-gray-900">
            {question.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {Object.entries(question.options).map(([letter, option], index) => {
            // letter is now from the object key (A, B, C, D)
            const isSelected = selectedAnswer === option;

            return (
              <Button
                key={option}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto min-h-[60px] w-full justify-start text-wrap p-4 text-left ${
                  isSelected ? "ring-2 ring-offset-2" : ""
                }`}
                style={{
                  backgroundColor: isSelected ? teamColor : undefined,
                  borderColor: isSelected ? teamColor : undefined,
                }}
                onClick={() => onAnswerSelect(option)}
                disabled={hasSubmitted}
              >
                <span className="flex w-full items-start space-x-3">
                  <span
                    className={`rounded px-2 py-1 text-sm font-bold ${
                      isSelected ? "bg-white/20" : "bg-gray-100"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 text-lg leading-relaxed">
                    {option}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>

        {/* Instructions */}
        {!hasSubmitted && (
          <div className="text-center text-sm text-gray-500">
            {selectedAnswer
              ? 'Tap "Submit Answer" to confirm your choice'
              : "Select an answer above"}
          </div>
        )}
      </div>
    </Card>
  );
};
