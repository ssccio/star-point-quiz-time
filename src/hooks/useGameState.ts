import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleQuestions } from '@/utils/sampleData';
import { DEMO_SCORES, DEMO_TEAMMATES, APP_CONFIG } from '@/utils/config';

export type GamePhase = 'question' | 'answer-reveal' | 'leaderboard' | 'final-wager' | 'results';

export interface TeamScores {
  adah: number;
  ruth: number;
  esther: number;
  martha: number;
  electa: number;
}

export interface TeamMate {
  name: string;
  hasAnswered: boolean;
}

export const useGameState = (playerName: string | undefined, teamId: string | undefined) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('question');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [scores, setScores] = useState<TeamScores>(
    APP_CONFIG.USE_DEMO_DATA ? DEMO_SCORES : {
      adah: 0,
      ruth: 0,
      esther: 0,
      martha: 0,
      electa: 0
    }
  );
  const [teamMates, setTeamMates] = useState<TeamMate[]>(
    APP_CONFIG.USE_DEMO_DATA ? [...DEMO_TEAMMATES] : []
  );

  const currentQuestion = sampleQuestions[currentQuestionIndex];

  const handleAnswerSelect = useCallback((answer: string) => {
    if (hasSubmitted) return;
    setSelectedAnswer(answer);
  }, [hasSubmitted]);

  const handleSubmitAnswer = useCallback(() => {
    if (!selectedAnswer || hasSubmitted || !playerName) return;
    setHasSubmitted(true);
    
    // Mark player as answered
    setTeamMates(prev => prev.map(mate => 
      mate.name === playerName ? { ...mate, hasAnswered: true } : mate
    ));
    
    // Simulate processing time
    setTimeout(() => {
      setPhase('answer-reveal');
    }, 1000);
  }, [selectedAnswer, hasSubmitted, playerName]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setPhase('question');
      setSelectedAnswer(null);
      setHasSubmitted(false);
      
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
  }, [currentQuestionIndex, navigate, playerName, teamId, scores]);

  const handleTimeUp = useCallback(() => {
    if (!hasSubmitted) {
      setPhase('answer-reveal');
    }
  }, [hasSubmitted]);

  return {
    currentQuestionIndex,
    phase,
    setPhase,
    selectedAnswer,
    hasSubmitted,
    scores,
    teamMates,
    currentQuestion,
    handleAnswerSelect,
    handleSubmitAnswer,
    handleNextQuestion,
    handleTimeUp
  };
};