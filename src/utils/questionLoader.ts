import * as yaml from "js-yaml";

// Fisher-Yates shuffle algorithm for randomizing array order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface QuestionSet {
  metadata: {
    title: string;
    description: string;
    difficulty: string;
    category: string;
    created: string;
    version: string;
  };
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

// Convert YAML question format to the existing TypeScript format
function convertToLegacyFormat(questions: Question[], randomizeAnswers = true) {
  return questions.map((q) => {
    if (!randomizeAnswers) {
      return {
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer, // Convert snake_case to camelCase
        explanation: q.explanation,
      };
    }

    // Find the index of the correct answer before shuffling
    const correctIndex = q.options.indexOf(q.correct_answer);
    if (correctIndex === -1) {
      console.warn(
        `Correct answer "${q.correct_answer}" not found in options for question ${q.id}`
      );
      // If correct answer not found, don't shuffle
      return {
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      };
    }

    // Shuffle the options array
    const shuffledOptions = shuffleArray(q.options);

    // Find where the correct answer ended up after shuffling
    const newCorrectAnswer =
      shuffledOptions.find((option) => option === q.correct_answer) ||
      q.correct_answer;

    return {
      id: q.id,
      text: q.text,
      options: shuffledOptions,
      correctAnswer: newCorrectAnswer, // This should be the same value, just in a new position
      explanation: q.explanation,
    };
  });
}

// Load questions from YAML file
export async function loadQuestionsFromYAML(
  filename: string,
  randomizeQuestions = true,
  randomizeAnswers = true
) {
  try {
    // In development, we'll load from the public directory
    // In production, questions should be bundled with the app
    const response = await fetch(`/questions/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.statusText}`);
    }

    const yamlContent = await response.text();
    const questionSet = yaml.load(yamlContent) as QuestionSet;

    if (!questionSet || !questionSet.questions) {
      throw new Error("Invalid question file format");
    }

    const convertedQuestions = convertToLegacyFormat(
      questionSet.questions,
      randomizeAnswers
    );

    return {
      metadata: questionSet.metadata,
      questions: randomizeQuestions
        ? shuffleArray(convertedQuestions)
        : convertedQuestions,
    };
  } catch (error) {
    console.error("Error loading questions from YAML:", error);
    throw error;
  }
}

// Get list of available question sets
export function getAvailableQuestionSets(): {
  id: string;
  title: string;
  description: string;
}[] {
  // For now, return a hardcoded list
  // In the future, this could be dynamic based on available files
  return [
    {
      id: "rob-morris-biography",
      title: "Rob Morris Biography & Eastern Star History",
      description:
        "Comprehensive questions about Rob Morris's life and the founding of the Eastern Star",
    },
    {
      id: "rob-morris-easy",
      title: "Rob Morris & Eastern Star Basics",
      description:
        "Easy questions about Rob Morris and fundamental Eastern Star knowledge",
    },
    {
      id: "eastern-star-basics",
      title: "Eastern Star Fundamentals",
      description: "Basic knowledge about the Order of the Eastern Star",
    },
  ];
}

// Load the default question set (Rob Morris Biography)
export async function loadDefaultQuestions(
  randomizeQuestions = true,
  randomizeAnswers = true
) {
  try {
    return await loadQuestionsFromYAML(
      "rob-morris-biography.yaml",
      randomizeQuestions,
      randomizeAnswers
    );
  } catch (error) {
    console.warn(
      "Failed to load YAML questions, falling back to hardcoded questions"
    );
    // Fallback to the original hardcoded questions
    const { sampleQuestions } = await import("./sampleData");
    return {
      metadata: {
        title: "Eastern Star Trivia (Legacy)",
        description: "Original hardcoded questions",
        difficulty: "mixed",
        category: "legacy",
        created: "2025-01-01",
        version: "1.0",
      },
      questions: randomizeQuestions
        ? shuffleArray(sampleQuestions)
        : sampleQuestions,
    };
  }
}
