import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users } from "lucide-react";
import { gameService } from "@/lib/gameService";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

interface QuestionAnswer {
  player_id: string;
  player_name: string;
  team: string;
  answer: string;
  is_correct: boolean;
  answered_at: string;
}

interface QuestionDisplayProps {
  currentQuestion: number;
  question: Question;
  gameId?: string;
  totalPlayers?: number;
}

export const QuestionDisplay = ({
  currentQuestion,
  question,
  gameId,
  totalPlayers = 0,
}: QuestionDisplayProps) => {
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId || currentQuestion < 0) return;

    const loadAnswers = async () => {
      setLoading(true);
      try {
        const questionNumber = currentQuestion + 1;
        console.log("Loading answers for:", {
          gameId,
          currentQuestion,
          questionNumber,
        });
        const questionAnswers = await gameService.getQuestionAnswers(
          gameId,
          questionNumber
        );
        console.log("Loaded answers:", questionAnswers);
        setAnswers(questionAnswers);
      } catch (error) {
        console.error("Failed to load answers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnswers();

    // Subscribe to real-time answer updates
    const subscription = gameService.subscribeToAnswers(
      gameId,
      currentQuestion + 1,
      (updatedAnswers) => {
        console.log("Answer subscription update:", updatedAnswers);
        setAnswers(updatedAnswers);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [gameId, currentQuestion]);

  const answeredCount = answers.length;
  const correctCount = answers.filter((a) => a.is_correct).length;
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Current Question</h2>
          {gameId && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {answeredCount}/{totalPlayers} answered
                </span>
              </div>
              {answeredCount > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">{correctCount} correct</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 text-sm text-gray-500">
              Question {currentQuestion + 1}
            </div>
            <div className="text-lg font-medium text-gray-900">
              {question?.text || "No question loaded"}
            </div>
          </div>

          {question?.options && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {question.options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isCorrect = option === question.correctAnswer;
                const answerCount = answers.filter(
                  (a) => a.answer === option
                ).length;

                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${
                      isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="mr-2 font-bold">{letter}.</span>
                        <span>{option}</span>
                        {isCorrect && (
                          <span className="ml-2 font-bold text-green-600">
                            ✓
                          </span>
                        )}
                      </div>
                      {gameId && answerCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {answerCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Real-time Answer Feed */}
      {gameId && answers.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Answers
          </h3>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {answers
              .sort(
                (a, b) =>
                  new Date(b.answered_at).getTime() -
                  new Date(a.answered_at).getTime()
              )
              .slice(0, 20)
              .map((answer) => {
                const team = TEAMS[answer.team as keyof typeof TEAMS];
                const teamColor =
                  TEAM_COLORS[answer.team as keyof typeof TEAM_COLORS];

                return (
                  <div
                    key={`${answer.player_id}-${answer.answered_at}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        {answer.player_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{answer.player_name}</div>
                        <div className="text-sm text-gray-500">
                          {team?.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{answer.answer}</span>
                      {answer.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-200">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {loading && (
        <div className="py-4 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-400" />
          <div className="text-sm text-gray-500">Loading answers...</div>
        </div>
      )}
    </div>
  );
};
