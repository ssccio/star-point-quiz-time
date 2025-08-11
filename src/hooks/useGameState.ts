import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sampleQuestions } from "@/utils/sampleData";
import {
  loadDefaultQuestions,
  loadQuestionsFromYAML,
} from "@/utils/questionLoader";
import { APP_CONFIG } from "@/utils/config";
import { gameService } from "@/lib/gameService";
import { practiceService } from "@/lib/practiceService";
import { useSupabaseSubscription } from "./useSupabaseSubscription";

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
  playerId?: string,
  questionSetId?: string
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
  const [playerScore, setPlayerScore] = useState(0);
  const [questions, setQuestions] = useState(sampleQuestions);
  const [questionMetadata, setQuestionMetadata] = useState<{
    title: string;
    description: string;
    difficulty: string;
    category: string;
    created: string;
    version: string;
  } | null>(null);

  // Define syncGameState outside useEffect so it can be exposed
  const syncGameState = useCallback(async () => {
    if (isPracticeMode || !gameId) return;

    const gameData = JSON.parse(localStorage.getItem("gameData") || "{}");
    const gameCode = gameData.gameCode;

    console.log(
      `[SYNC] Starting sync - gameId: ${gameId}, gameCode: ${gameCode}, path: ${window.location.pathname}, phase: ${phase}`
    );
    if (!gameCode) return;
    try {
      const game = await gameService.getGame(gameCode);
      console.log(`[SYNC] Retrieved game:`, game);
      if (!game) {
        console.log("Game no longer exists - redirecting to error recovery");
        navigate("/new-game", {
          state: {
            playerName,
            team: teamId,
            fromError: true,
          },
        });
        return;
      }

      // Check for game status changes (most critical for phone lock scenarios)
      console.log(
        `[SYNC] Game status: ${game.status}, current path: ${window.location.pathname}, phase: ${phase}`
      );
      if (game.status === "active") {
        console.log("Game is active - ensuring we're in the game");
        // If we're still on waiting/lobby screen but game is active, navigate to game
        if (
          window.location.pathname === "/lobby" ||
          window.location.pathname === "/team-join"
        ) {
          console.log(
            `[SYNC] ⚠️ CRITICAL: Redirecting from ${window.location.pathname} to active game`
          );
          navigate("/game", {
            state: { playerName, team: teamId },
          });
          return;
        }
        // If we're on the game page but showing "waiting", force a question state update
        if (window.location.pathname === "/game" && phase === "question") {
          console.log(
            `[SYNC] ⚠️ On game page with active game - forcing question sync (current Q: ${currentQuestionIndex + 1}, game Q: ${game.current_question})`
          );
          // This will trigger the question sync logic below
        }
      } else if (game.status === "finished") {
        console.log("Game finished - redirecting to results");
        navigate("/results", {
          state: {
            playerName,
            team: teamId,
            finalScores: scores,
          },
        });
        return;
      }

      // Check if we need to reload questions (critical for phone lock recovery)
      const gameQuestionIndex = (game.current_question || 1) - 1;
      const needsQuestionReload =
        gameQuestionIndex >= questions.length ||
        questions === sampleQuestions ||
        questions.length < 10; // Likely still default questions

      if (needsQuestionReload) {
        console.log(
          `[SYNC] 🔄 RELOADING QUESTIONS: game wants index ${gameQuestionIndex} but we only have ${questions.length} questions`
        );
        try {
          const gameQuestions = await gameService.getGameQuestions(gameId);
          if (gameQuestions.length > 0) {
            console.log(
              `[SYNC] ✅ Reloaded ${gameQuestions.length} questions from database`
            );
            // Convert database questions to the format expected by the game
            const convertedQuestions = gameQuestions.map((q) => ({
              id: q.question_number.toString(),
              question: q.question_text,
              options: {
                A: q.option_a,
                B: q.option_b,
                C: q.option_c,
                D: q.option_d,
              },
              correctAnswer: q.correct_answer,
              explanation: q.explanation,
            }));
            setQuestions(convertedQuestions);
            console.log(
              `[SYNC] ✅ Questions updated, now have ${convertedQuestions.length} questions`
            );
          }
        } catch (error) {
          console.error("[SYNC] ❌ Failed to reload questions:", error);
        }
      }

      if (game.current_question !== currentQuestionIndex + 1) {
        console.log(
          "Syncing question from",
          currentQuestionIndex + 1,
          "to",
          game.current_question
        );
        setCurrentQuestionIndex((game.current_question || 1) - 1);
        setPhase("question");
        setSelectedAnswer(null);
        setHasSubmitted(false);
        setTeamMates((prev) =>
          prev.map((mate) => ({ ...mate, hasAnswered: false }))
        );
      }
    } catch (error) {
      console.error("Failed to sync game state:", error);
      navigate("/new-game", {
        state: {
          playerName,
          team: teamId,
          fromError: true,
        },
      });
    }
  }, [
    isPracticeMode,
    gameId,
    currentQuestionIndex,
    navigate,
    playerName,
    teamId,
    phase,
    scores,
  ]);

  // Practice mode specific state
  const [practiceStats, setPracticeStats] = useState({
    correctAnswers: 0,
    totalAnswered: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(
    null
  );

  // Load questions from YAML on mount (practice mode) or database (multiplayer)
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        let questionsData;

        if (isPracticeMode && questionSetId) {
          // Load specific question set for practice mode
          questionsData = await loadQuestionsFromYAML(`${questionSetId}.yaml`);
          console.log("Loaded practice questions:", questionSetId);
        } else if (isPracticeMode) {
          // Load default questions for practice mode
          questionsData = await loadDefaultQuestions();
          console.log("Loaded default questions for practice");
        } else if (gameId) {
          // For multiplayer mode, get questions from the database
          try {
            const gameQuestions = await gameService.getGameQuestions(gameId);
            if (gameQuestions.length > 0) {
              // Convert database questions to the format expected by the game
              const convertedQuestions = gameQuestions.map((q) => ({
                id: q.question_number.toString(),
                question: q.question_text,
                options: {
                  A: q.option_a,
                  B: q.option_b,
                  C: q.option_c,
                  D: q.option_d,
                },
                correctAnswer: q.correct_answer,
                explanation: q.explanation || "",
              }));

              setQuestions(convertedQuestions);
              setQuestionMetadata({
                title: "Eastern Star Trivia",
                description: "Synchronized multiplayer questions",
                difficulty: "mixed",
                category: "multiplayer",
                created: new Date().toISOString().split("T")[0],
                version: "1.0",
              });
              console.log(
                "Loaded",
                gameQuestions.length,
                "questions from database for game",
                gameId
              );
              return;
            }
          } catch (error) {
            console.error("Failed to load questions from database:", error);
            // Fall back to default questions
          }

          // Fallback: load default questions if database fetch failed
          // IMPORTANT: Don't randomize for multiplayer - all players need same order!
          questionsData = await loadDefaultQuestions(false, false); // No randomization
          console.log(
            "Loaded fallback default questions for multiplayer (not randomized)"
          );
        } else {
          // Fallback case
          questionsData = await loadDefaultQuestions();
          console.log("Loaded fallback questions");
        }

        if (questionsData) {
          setQuestions(questionsData.questions);
          setQuestionMetadata(questionsData.metadata);
        }

        // Start practice session tracking if in practice mode
        if (
          isPracticeMode &&
          playerName &&
          teamId &&
          questionSetId &&
          !practiceSessionId
        ) {
          const sessionId = practiceService.startPracticeSession(
            playerName,
            teamId,
            questionSetId,
            questionsData.metadata.title,
            questionsData.questions.length
          );
          setPracticeSessionId(sessionId);
        }
      } catch (error) {
        console.warn("Using fallback questions:", error);
        // questions is already initialized with sampleQuestions
      }
    };

    loadQuestions();
  }, [
    isPracticeMode,
    questionSetId,
    playerName,
    teamId,
    practiceSessionId,
    gameId,
  ]);

  // Subscribe to game state changes for multiplayer mode with reconnection
  const gameSubscription = useSupabaseSubscription(
    () => {
      if (isPracticeMode || !gameId) return null;

      return gameService.subscribeToGame(gameId, (updatedGame) => {
        console.log("Game update received:", updatedGame);

        // Handle game deletion (null/undefined game)
        if (!updatedGame) {
          console.log("Game was deleted - redirecting to error recovery");
          navigate("/new-game", {
            state: {
              playerName,
              team: teamId,
              fromError: true,
            },
          });
          return;
        }

        // Sync current question index with game state
        if (
          updatedGame.current_question &&
          updatedGame.current_question !== currentQuestionIndex + 1
        ) {
          console.log(
            "Question changed from",
            currentQuestionIndex + 1,
            "to",
            updatedGame.current_question
          );
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
    },
    [isPracticeMode, gameId, currentQuestionIndex, playerName, teamId, scores],
    {
      debugLabel: "GameState",
      enableToasts: true,
      onReconnected: () => {
        console.log("Game subscription reconnected - syncing state");
        syncGameState();
      },
    }
  );

  // Initial sync for multiplayer mode
  useEffect(() => {
    if (isPracticeMode || !gameId) return;
    syncGameState();
  }, [
    isPracticeMode,
    gameId,
    currentQuestionIndex,
    navigate,
    playerName,
    teamId,
    scores,
    syncGameState,
  ]);

  // Periodic sync check for phone lock scenarios - runs on waiting screens and during game
  useEffect(() => {
    if (isPracticeMode || !gameId) return;

    console.log("Setting up periodic sync check for phone lock recovery");

    // More aggressive polling during waiting period to catch game start
    let checkInterval = 1500; // Default: every 1.5 seconds for active games

    // Check if we're likely in waiting period by looking at current path and game status
    const isWaitingContext =
      window.location.pathname === "/lobby" ||
      window.location.pathname === "/team-join";

    if (isWaitingContext) {
      checkInterval = 1000; // More frequent during waiting period: every 1 second
      console.log("Using aggressive 1-second polling for waiting period");
    }

    const interval = setInterval(() => {
      const currentPath = window.location.pathname;
      console.log(
        `Periodic sync check (${checkInterval}ms interval) - path: ${currentPath}`
      );
      syncGameState();
    }, checkInterval);

    return () => {
      console.log("Clearing periodic sync check");
      clearInterval(interval);
    };
  }, [isPracticeMode, gameId, syncGameState]);

  // Add focus event listener as additional recovery trigger (for phones returning from lock)
  useEffect(() => {
    if (isPracticeMode || !gameId) return;

    const handleFocus = () => {
      console.log("Window focus event - triggering emergency sync");
      setTimeout(() => {
        syncGameState();
      }, 100); // Small delay to ensure DOM is ready
    };

    const handleOnline = () => {
      console.log("Network online event - triggering emergency sync");
      setTimeout(() => {
        syncGameState();
      }, 500); // Delay for network to stabilize
    };

    const handleUserInteraction = () => {
      console.log("User interaction detected - triggering emergency sync");
      setTimeout(() => {
        syncGameState();
      }, 50);
    };

    // Listen to multiple events that could indicate phone unlock/reconnection
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    // Add user interaction events as they often indicate phone unlock
    window.addEventListener("touchstart", handleUserInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("click", handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("click", handleUserInteraction);
    };
  }, [isPracticeMode, gameId, syncGameState]);

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

        // Calculate team scores from all players
        const teamScores: TeamScores = {
          adah: 0,
          ruth: 0,
          esther: 0,
          martha: 0,
          electa: 0,
        };

        players.forEach((player) => {
          if (player.team in teamScores) {
            teamScores[player.team as keyof TeamScores] += player.score || 0;
          }
        });

        setScores(teamScores);

        // Update current player's score
        const currentPlayer = players.find((p) => p.name === playerName);
        if (currentPlayer) {
          setPlayerScore(currentPlayer.score || 0);
        }
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

    // Subscribe to player score updates
    const playerSubscription = gameService.subscribeToPlayers(
      gameId,
      (players) => {
        // Update team scores when players change
        const teamScores: TeamScores = {
          adah: 0,
          ruth: 0,
          esther: 0,
          martha: 0,
          electa: 0,
        };

        players.forEach((player) => {
          if (player.team in teamScores) {
            teamScores[player.team as keyof TeamScores] += player.score || 0;
          }
        });

        setScores(teamScores);

        // Update current player's score
        const currentPlayer = players.find((p) => p.name === playerName);
        if (currentPlayer) {
          setPlayerScore(currentPlayer.score || 0);
        }

        // Update teammates list
        const teamPlayers = players.filter((p) => p.team === teamId);
        setTeamMates((prev) =>
          teamPlayers.map((p) => ({
            name: p.name,
            hasAnswered:
              prev.find((mate) => mate.name === p.name)?.hasAnswered || false,
          }))
        );
      }
    );

    return () => {
      answerSub.then((sub) => sub?.unsubscribe());
      playerSubscription?.unsubscribe();
    };
  }, [isPracticeMode, gameId, teamId, currentQuestionIndex, playerName]);

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
      const isCorrect =
        selectedAnswer ===
        currentQuestion.options[currentQuestion.correctAnswer];
      setPracticeStats((prev) => {
        const newStats = {
          correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
          totalAnswered: prev.totalAnswered + 1,
          currentStreak: isCorrect ? prev.currentStreak + 1 : 0,
          bestStreak: isCorrect
            ? Math.max(prev.bestStreak, prev.currentStreak + 1)
            : prev.bestStreak,
        };

        // Update practice session
        if (practiceSessionId) {
          practiceService.updatePracticeSession(
            practiceSessionId,
            newStats.correctAnswers,
            false
          );
        }

        return newStats;
      });

      // For practice mode, just show results after delay
      setTimeout(() => {
        setTimeUp(false); // User submitted, not time up
        setPhase("answer-reveal");
      }, 1000);
    } else if (gameId && playerId && currentQuestion) {
      // Submit answer to database for multiplayer mode
      try {
        const isCorrect =
          selectedAnswer ===
          currentQuestion.options[currentQuestion.correctAnswer];
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
          setTimeUp(false); // User submitted, not time up
          setPhase("answer-reveal");
        }, 1000);
      } catch (error) {
        console.error("Failed to submit answer:", error);

        // Check if this is because the game was deleted
        if (
          error instanceof Error &&
          error.message.includes("Game not found")
        ) {
          console.log(
            "Game was deleted during answer submission - redirecting to error recovery"
          );
          navigate("/new-game", {
            state: {
              playerName,
              team: teamId,
              fromError: true,
            },
          });
          return;
        }

        // Still show answer phase even if submission failed
        setTimeout(() => {
          setTimeUp(false); // User submitted, not time up
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
        setTimeUp(false); // User submitted, not time up
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
    navigate,
    practiceSessionId,
    teamId,
  ]);

  const handleNextQuestion = useCallback(() => {
    // In practice mode, advance questions locally
    if (isPracticeMode) {
      if (currentQuestionIndex < questions.length - 1) {
        // Batch all state updates to prevent multiple timer resets
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setPhase("question");
        setSelectedAnswer(null);
        setHasSubmitted(false);
        setTimeUp(false);
      } else {
        // Mark practice session as complete
        if (practiceSessionId) {
          practiceService.updatePracticeSession(
            practiceSessionId,
            practiceStats.correctAnswers,
            true
          );
        }

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
    isPracticeMode,
    practiceStats,
    practiceSessionId,
  ]);

  const [timeUp, setTimeUp] = useState(false);

  const handleTimeUp = useCallback(() => {
    if (!hasSubmitted) {
      setTimeUp(true);
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
    playerScore,
    teamMates,
    currentQuestion,
    questions,
    questionMetadata,
    practiceStats,
    isPracticeMode,
    timeUp,
    handleAnswerSelect,
    handleSubmitAnswer,
    handleNextQuestion,
    handleTimeUp,
    syncGameState,
  };
};
