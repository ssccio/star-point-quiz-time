import * as yaml from "js-yaml";

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
function convertToLegacyFormat(questions: Question[]) {
  return questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
    correctAnswer: q.correct_answer, // Convert snake_case to camelCase
    explanation: q.explanation,
  }));
}

// Load questions from YAML file
export async function loadQuestionsFromYAML(filename: string) {
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

    return {
      metadata: questionSet.metadata,
      questions: convertToLegacyFormat(questionSet.questions),
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

// Load the default question set (Rob Morris Easy)
export async function loadDefaultQuestions() {
  try {
    return await loadQuestionsFromYAML("rob-morris-easy.yaml");
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
      questions: sampleQuestions,
    };
  }
}
