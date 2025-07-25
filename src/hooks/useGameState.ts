import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleQuestions } from '@/utils/sampleData';
import { loadDefaultQuestions } from '@/utils/questionLoader';
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

export const useGameState = (playerName: string | undefined, teamId: string | undefined, isPracticeMode = false) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('question');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [scores, setScores] = useState<TeamScores>(
    isPracticeMode ? {
      adah: 0,
      ruth: 0,
      esther: 0,
      martha: 0,
      electa: 0
    } : (APP_CONFIG.USE_DEMO_DATA ? DEMO_SCORES : {
      adah: 0,
      ruth: 0,
      esther: 0,
      martha: 0,
      electa: 0
    })
  );
  const [teamMates, setTeamMates] = useState<TeamMate[]>(
    isPracticeMode ? [] : (APP_CONFIG.USE_DEMO_DATA ? [...DEMO_TEAMMATES] : [])
  );
  const [questions, setQuestions] = useState(sampleQuestions);
  const [questionMetadata, setQuestionMetadata] = useState<{
    title: string;
    description: string;
    difficulty: string;
    category: string;
    created: string;
    version: string;
  } | null>(null);
  
  // Practice mode specific state
  const [practiceStats, setPracticeStats] = useState({
    correctAnswers: 0,
    totalAnswered: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // Load questions from YAML on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { questions: yamlQuestions, metadata } = await loadDefaultQuestions();
        setQuestions(yamlQuestions);
        setQuestionMetadata(metadata);
        console.log('Loaded questions from YAML:', metadata.title);
      } catch (error) {
        console.warn('Using fallback questions:', error);
        // questions is already initialized with sampleQuestions
      }
    };
    
    loadQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = useCallback((answer: string) => {
    if (hasSubmitted) return;
    setSelectedAnswer(answer);
  }, [hasSubmitted]);

  const handleSubmitAnswer = useCallback(() => {
    if (!selectedAnswer || hasSubmitted || !playerName) return;
    setHasSubmitted(true);
    
    // Track practice stats if in practice mode
    if (isPracticeMode && currentQuestion) {
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      setPracticeStats(prev => ({
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        totalAnswered: prev.totalAnswered + 1,
        currentStreak: isCorrect ? prev.currentStreak + 1 : 0,
        bestStreak: isCorrect 
          ? Math.max(prev.bestStreak, prev.currentStreak + 1)
          : prev.bestStreak
      }));
    }
    
    // Mark player as answered (only for multiplayer mode)
    if (!isPracticeMode) {
      setTeamMates(prev => prev.map(mate => 
        mate.name === playerName ? { ...mate, hasAnswered: true } : mate
      ));
    }
    
    // Simulate processing time
    setTimeout(() => {
      setPhase('answer-reveal');
    }, 1000);
  }, [selectedAnswer, hasSubmitted, playerName, isPracticeMode, currentQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setPhase('question');
      setSelectedAnswer(null);
      setHasSubmitted(false);
      
      // Only update multiplayer state if not in practice mode
      if (!isPracticeMode) {
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
      }
    } else {
      // Navigate to different results based on mode
      if (isPracticeMode) {
        navigate('/results', { 
          state: { 
            playerName, 
            team: teamId, 
            practiceMode: true,
            practiceStats,
            totalQuestions: questions.length
          } 
        });
      } else {
        navigate('/results', { 
          state: { 
            playerName, 
            team: teamId, 
            finalScores: scores 
          } 
        });
      }
    }
  }, [currentQuestionIndex, questions.length, navigate, playerName, teamId, scores, isPracticeMode, practiceStats]);

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
    questions,
    questionMetadata,
    practiceStats,
    isPracticeMode,
    handleAnswerSelect,
    handleSubmitAnswer,
    handleNextQuestion,
    handleTimeUp
  };
};