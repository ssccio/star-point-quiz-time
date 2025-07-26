import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Users } from 'lucide-react';
import { gameService } from '@/lib/gameService';
import { TEAMS, TEAM_COLORS } from '@/utils/constants';

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

export const QuestionDisplay = ({ currentQuestion, question, gameId, totalPlayers = 0 }: QuestionDisplayProps) => {
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId || currentQuestion < 0) return;

    const loadAnswers = async () => {
      setLoading(true);
      try {
        const questionAnswers = await gameService.getQuestionAnswers(gameId, currentQuestion + 1);
        setAnswers(questionAnswers);
      } catch (error) {
        console.error('Failed to load answers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnswers();

    // Subscribe to real-time answer updates
    const subscription = gameService.subscribeToAnswers(gameId, currentQuestion + 1, (updatedAnswers) => {
      setAnswers(updatedAnswers);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [gameId, currentQuestion]);

  const answeredCount = answers.length;
  const correctCount = answers.filter(a => a.is_correct).length;
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Current Question</h2>
          {gameId && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {answeredCount}/{totalPlayers} answered
                </span>
              </div>
              {answeredCount > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">
                    {correctCount} correct
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
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
                const answerCount = answers.filter(a => a.answer === option).length;
                
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold mr-2">{letter}.</span>
                        <span>{option}</span>
                        {isCorrect && <span className="ml-2 text-green-600 font-bold">✓</span>}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Answers</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {answers
              .sort((a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime())
              .slice(0, 20)
              .map((answer) => {
                const team = TEAMS[answer.team as keyof typeof TEAMS];
                const teamColor = TEAM_COLORS[answer.team as keyof typeof TEAM_COLORS];
                
                return (
                  <div key={`${answer.player_id}-${answer.answered_at}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: teamColor }}
                      >
                        {answer.player_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{answer.player_name}</div>
                        <div className="text-sm text-gray-500">{team?.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{answer.answer}</span>
                      {answer.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
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
        <div className="text-center py-4">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <div className="text-sm text-gray-500">Loading answers...</div>
        </div>
      )}
    </div>
  );
};