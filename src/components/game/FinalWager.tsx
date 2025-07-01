import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trophy, DollarSign } from 'lucide-react';

interface FinalWagerProps {
  category: string;
  currentScore: number;
  maxWager: number;
  onWagerSubmit: (amount: number) => void;
  teamColor: string;
}

export const FinalWager = ({ 
  category, 
  currentScore, 
  maxWager, 
  onWagerSubmit, 
  teamColor 
}: FinalWagerProps) => {
  const [wagerAmount, setWagerAmount] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleWagerSubmit = () => {
    setIsConfirmed(true);
    setTimeout(() => {
      onWagerSubmit(wagerAmount);
    }, 1000);
  };

  const potentialScore = currentScore + wagerAmount;
  const worstScore = currentScore - wagerAmount;

  return (
    <div className="space-y-6">
      <Card className="p-6 text-center bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex justify-center mb-4">
          <Trophy className="w-16 h-16 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Final Wager!</h2>
        <p className="text-xl text-gray-700 mb-4">Category: <span className="font-bold">{category}</span></p>
        <p className="text-gray-600">
          Place your final wager before seeing the question. You can wager between 0 and {maxWager} points.
        </p>
      </Card>

      {!isConfirmed ? (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-2">Current Score: {currentScore} points</div>
              <div className="text-sm text-gray-600">Choose your wager amount</div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: teamColor }}>
                  {wagerAmount}
                </div>
                <div className="text-lg text-gray-600">points wagered</div>
              </div>

              <Slider
                value={[wagerAmount]}
                onValueChange={(value) => setWagerAmount(value[0])}
                max={maxWager}
                min={0}
                step={1}
                className="w-full"
              />

              <div className="flex justify-between text-sm text-gray-500">
                <span>0</span>
                <span>{maxWager}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => setWagerAmount(0)}
                className="min-h-[60px]"
              >
                <div className="text-center">
                  <div className="font-bold">Play Safe</div>
                  <div className="text-sm text-gray-500">0 points</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setWagerAmount(Math.floor(maxWager / 2))}
                className="min-h-[60px]"
              >
                <div className="text-center">
                  <div className="font-bold">Moderate Risk</div>
                  <div className="text-sm text-gray-500">{Math.floor(maxWager / 2)} points</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setWagerAmount(maxWager)}
                className="min-h-[60px]"
              >
                <div className="text-center">
                  <div className="font-bold">All In</div>
                  <div className="text-sm text-gray-500">{maxWager} points</div>
                </div>
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-green-600 font-bold text-lg">If Correct</div>
                  <div className="text-2xl font-bold text-green-600">{potentialScore}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
                <div>
                  <div className="text-red-600 font-bold text-lg">If Wrong</div>
                  <div className="text-2xl font-bold text-red-600">{worstScore}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleWagerSubmit}
              disabled={wagerAmount < 0}
              className="w-full min-h-[60px] text-lg font-semibold"
              style={{ backgroundColor: teamColor }}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Confirm Wager: {wagerAmount} Points
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-green-600 font-semibold text-xl">Wager Submitted!</div>
            <div className="text-gray-600">You've wagered <span className="font-bold">{wagerAmount} points</span></div>
            <div className="text-gray-500">Waiting for other teams...</div>
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};