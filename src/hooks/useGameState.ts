import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sampleQuestions } from "@/utils/sampleData";
import { loadDefaultQuestions } from "@/utils/questionLoader";
import { APP_CONFIG } from "@/utils/config";
import { gameService } from "@/lib/gameService";

export type GamePhase =
  | "question"
  | "answer-reveal"
  | "leaderboard"
  | "final-wager"
  | "results";

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

export const useGameState = (
  playerName: string | undefined,
  teamId: string | undefined,
  isPracticeMode = false,
  gameId?: string,
  playerId?: string
) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("question");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [scores, setScores] = useState<TeamScores>({
    adah: 0,
    ruth: 0,
    esther: 0,
    martha: 0,
    electa: 0,
  });
  const [teamMates, setTeamMates] = useState<TeamMate[]>([]);
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
    bestStreak: 0,
  });

  // Load questions from YAML on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { questions: yamlQuestions, metadata } =
          await loadDefaultQuestions();
        setQuestions(yamlQuestions);
        setQuestionMetadata(metadata);
        console.log("Loaded questions from YAML:", metadata.title);
      } catch (error) {
        console.warn("Using fallback questions:", error);
        // questions is already initialized with sampleQuestions
      }
    };

    loadQuestions();
  }, []);

  // Subscribe to game state changes for multiplayer mode
  useEffect(() => {
    if (isPracticeMode || !gameId) return;

    const subscription = gameService.subscribeToGame(gameId, (updatedGame) => {
      // Sync current question index with game state
      if (
        updatedGame.current_question &&
        updatedGame.current_question !== currentQuestionIndex + 1
      ) {
        setCurrentQuestionIndex(updatedGame.current_question - 1);
        setPhase("question");
        setSelectedAnswer(null);
        setHasSubmitted(false);
        // Reset teammates answered status for new question
        setTeamMates((prev) =>
          prev.map((mate) => ({ ...mate, hasAnswered: false }))
        );
      }

      // Handle game completion
      if (updatedGame.status === "finished") {
        navigate("/results", {
          state: {
            playerName,
            team: teamId,
            finalScores: scores,
          },
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [
    isPracticeMode,
    gameId,
    currentQuestionIndex,
    navigate,
    playerName,
    teamId,
    scores,
  ]);

  // Subscribe to real-time answer updates for teammates (multiplayer only)
  useEffect(() => {
    if (isPracticeMode || !gameId || !teamId) return;

    const loadTeammates = async () => {
      try {
        const players = await gameService.getPlayers(gameId);
        const teamPlayers = players.filter((p) => p.team === teamId);
        setTeamMates(
          teamPlayers.map((p) => ({
            name: p.name,
            hasAnswered: false, // Will be updated by answer subscription
          }))
        );
      } catch (error) {
        console.error("Failed to load teammates:", error);
      }
    };

    const subscribeToAnswers = async () => {
      const answerSubscription = gameService.subscribeToAnswers(
        gameId,
        currentQuestionIndex + 1,
        (answers) => {
          // Update teammate answer status based on who has submitted answers
          setTeamMates((prev) =>
            prev.map((mate) => ({
              ...mate,
              hasAnswered: answers.some(
                (answer) => answer.player_name === mate.name
              ),
            }))
          );
        }
      );

      return answerSubscription;
    };

    loadTeammates();
    const answerSub = subscribeToAnswers();

    return () => {
      answerSub.then((sub) => sub?.unsubscribe());
    };
  }, [isPracticeMode, gameId, teamId, currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (hasSubmitted) return;
      setSelectedAnswer(answer);
    },
    [hasSubmitted]
  );

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || hasSubmitted || !playerName) return;
    setHasSubmitted(true);

    // Track practice stats if in practice mode
    if (isPracticeMode && currentQuestion) {
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      setPracticeStats((prev) => ({
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        totalAnswered: prev.totalAnswered + 1,
        currentStreak: isCorrect ? prev.currentStreak + 1 : 0,
        bestStreak: isCorrect
          ? Math.max(prev.bestStreak, prev.currentStreak + 1)
          : prev.bestStreak,
      }));

      // For practice mode, just show results after delay
      setTimeout(() => {
        setPhase("answer-reveal");
      }, 1000);
    } else if (gameId && playerId && currentQuestion) {
      // Submit answer to database for multiplayer mode
      try {
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        await gameService.submitAnswer(
          gameId,
          playerId,
          currentQuestionIndex + 1, // Question IDs are 1-based
          selectedAnswer,
          isCorrect
        );

        // Mark player as answered locally
        setTeamMates((prev) =>
          prev.map((mate) =>
            mate.name === playerName ? { ...mate, hasAnswered: true } : mate
          )
        );

        // Show answer phase after brief delay
        setTimeout(() => {
          setPhase("answer-reveal");
        }, 1000);
      } catch (error) {
        console.error("Failed to submit answer:", error);
        // Still show answer phase even if submission failed
        setTimeout(() => {
          setPhase("answer-reveal");
        }, 1000);
      }
    } else {
      // Fallback for multiplayer without proper IDs
      setTeamMates((prev) =>
        prev.map((mate) =>
          mate.name === playerName ? { ...mate, hasAnswered: true } : mate
        )
      );
      setTimeout(() => {
        setPhase("answer-reveal");
      }, 1000);
    }
  }, [
    selectedAnswer,
    hasSubmitted,
    playerName,
    isPracticeMode,
    currentQuestion,
    gameId,
    playerId,
    currentQuestionIndex,
  ]);

  const handleNextQuestion = useCallback(() => {
    // In practice mode, advance questions locally
    if (isPracticeMode) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setPhase("question");
        setSelectedAnswer(null);
        setHasSubmitted(false);
      } else {
        navigate("/results", {
          state: {
            playerName,
            team: teamId,
            practiceMode: true,
            practiceStats,
            totalQuestions: questions.length,
          },
        });
      }
    } else {
      // In multiplayer mode, questions are controlled by admin
      // Players just see results and wait for admin to advance
      // The game state subscription will handle question changes
      console.log("Waiting for host to advance to next question...");
    }
  }, [
    currentQuestionIndex,
    questions.length,
    navigate,
    playerName,
    teamId,
    scores,
    isPracticeMode,
    practiceStats,
  ]);

  const handleTimeUp = useCallback(() => {
    if (!hasSubmitted) {
      setPhase("answer-reveal");
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
    handleTimeUp,
  };
};
