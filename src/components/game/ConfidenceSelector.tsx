import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface ConfidenceSelectorProps {
  availablePoints: number[];
  selectedPoints: number | null;
  onPointsSelect: (points: number) => void;
  teamColor: string;
}

export const ConfidenceSelector = ({ 
  availablePoints, 
  selectedPoints, 
  onPointsSelect, 
  teamColor 
}: ConfidenceSelectorProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900">Choose Your Confidence Level</h3>
          <p className="text-gray-600 mt-2">
            Select how many points you want to wager on the next question.
            Each point value can only be used once this round.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[2, 4, 6].map((points) => {
            const isAvailable = availablePoints.includes(points);
            const isSelected = selectedPoints === points;
            
            return (
              <Button
                key={points}
                variant={isSelected ? "default" : "outline"}
                disabled={!isAvailable}
                onClick={() => onPointsSelect(points)}
                className={`min-h-[80px] flex-col space-y-2 ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                } ${!isAvailable ? 'opacity-50' : ''}`}
                style={{
                  backgroundColor: isSelected ? teamColor : undefined,
                  borderColor: isSelected ? teamColor : undefined,
                }}
              >
                <div className="flex items-center space-x-1">
                  {Array.from({ length: points / 2 }, (_, i) => (
                    <Star key={i} className="w-4 h-4" />
                  ))}
                </div>
                <div className="text-2xl font-bold">{points}</div>
                <div className="text-sm">points</div>
                {!isAvailable && (
                  <div className="text-xs text-red-500">Used</div>
                )}
              </Button>
            );
          })}
        </div>

        <div className="text-center text-sm text-gray-500">
          {selectedPoints ? 
            `You've wagered ${selectedPoints} points on this question` : 
            'Select your confidence level to continue'
          }
        </div>
      </div>
    </Card>
  );
};