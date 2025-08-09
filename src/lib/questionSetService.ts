import { supabase } from "./supabase";
import type { Question } from "@/types/game";

export interface QuestionSet {
  id: string;
  name: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  category: string | null;
  version: string;
  question_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[];
}

class QuestionSetService {
  // Get all active question sets
  async getQuestionSets(includeInactive = false): Promise<QuestionSet[]> {
    const query = supabase.from("question_sets").select("*").order("name");

    if (!includeInactive) {
      query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching question sets:", error);
      throw error;
    }

    return data || [];
  }

  // Get a specific question set with all its questions
  async getQuestionSet(
    setId: string
  ): Promise<QuestionSetWithQuestions | null> {
    // Get the question set
    const { data: setData, error: setError } = await supabase
      .from("question_sets")
      .select("*")
      .eq("id", setId)
      .single();

    if (setError) {
      console.error("Error fetching question set:", setError);
      throw setError;
    }

    if (!setData) return null;

    // Get all questions for this set
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("question_set_id", setId)
      .order("question_number");

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      throw questionsError;
    }

    // Convert to the format expected by the game
    const questions: Question[] = (questionsData || []).map((q) => ({
      id: q.question_number.toString(),
      question: q.question_text,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      correctAnswer: q.correct_answer as "A" | "B" | "C" | "D",
      explanation: q.explanation || "",
    }));

    return {
      ...setData,
      questions,
    };
  }

  // Create a new question set
  async createQuestionSet(
    name: string,
    description: string,
    difficulty: "easy" | "medium" | "hard" | "mixed",
    category: string,
    questions: Question[]
  ): Promise<string> {
    // Create the question set
    const { data: setData, error: setError } = await supabase
      .from("question_sets")
      .insert({
        name,
        description,
        difficulty,
        category,
        version: "1.0",
        is_active: true,
      })
      .select()
      .single();

    if (setError) {
      console.error("Error creating question set:", setError);
      throw setError;
    }

    // Add questions to the set
    const questionsToInsert = questions.map((q, index) => ({
      question_set_id: setData.id,
      question_number: index + 1,
      question_text: q.question,
      option_a: q.options.A,
      option_b: q.options.B,
      option_c: q.options.C,
      option_d: q.options.D,
      correct_answer: q.correctAnswer,
      explanation: q.explanation || null,
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Error adding questions:", questionsError);
      // Try to clean up the question set if questions failed
      await supabase.from("question_sets").delete().eq("id", setData.id);
      throw questionsError;
    }

    return setData.id;
  }

  // Update a question set's metadata
  async updateQuestionSet(
    setId: string,
    updates: Partial<
      Pick<
        QuestionSet,
        "name" | "description" | "difficulty" | "category" | "is_active"
      >
    >
  ): Promise<void> {
    const { error } = await supabase
      .from("question_sets")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", setId);

    if (error) {
      console.error("Error updating question set:", error);
      throw error;
    }
  }

  // Delete a question set (will cascade delete all questions)
  async deleteQuestionSet(setId: string): Promise<void> {
    const { error } = await supabase
      .from("question_sets")
      .delete()
      .eq("id", setId);

    if (error) {
      console.error("Error deleting question set:", error);
      throw error;
    }
  }

  // Copy questions from a set to game_questions for a specific game
  async copyQuestionsToGame(
    gameId: string,
    questionSetId: string,
    randomize = true
  ): Promise<void> {
    // Get all questions from the set
    const { data: questionsData, error: fetchError } = await supabase
      .from("questions")
      .select("*")
      .eq("question_set_id", questionSetId)
      .order("question_number");

    if (fetchError) {
      console.error("Error fetching questions for game:", fetchError);
      throw fetchError;
    }

    if (!questionsData || questionsData.length === 0) {
      throw new Error("No questions found in the selected set");
    }

    // Randomize if requested
    const orderedQuestions = [...questionsData];
    if (randomize) {
      // Fisher-Yates shuffle
      for (let i = orderedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedQuestions[i], orderedQuestions[j]] = [
          orderedQuestions[j],
          orderedQuestions[i],
        ];
      }
    }

    // Create game_questions entries
    const gameQuestions = orderedQuestions.map((q, index) => ({
      game_id: gameId,
      question_number: index + 1,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));

    const { error: insertError } = await supabase
      .from("game_questions")
      .insert(gameQuestions);

    if (insertError) {
      console.error("Error copying questions to game:", insertError);
      throw insertError;
    }

    // Update the game to track which question set was used
    const { error: updateError } = await supabase
      .from("games")
      .update({ question_set_id: questionSetId })
      .eq("id", gameId);

    if (updateError) {
      console.error("Error updating game with question set:", updateError);
      // Don't throw here, the questions are already copied
    }
  }

  // Import questions from YAML format (for initial setup)
  async importFromYAML(
    name: string,
    yamlData: {
      metadata: {
        title: string;
        description: string;
        difficulty: string;
        category: string;
      };
      questions: Question[];
    }
  ): Promise<string> {
    const difficulty = yamlData.metadata.difficulty as
      | "easy"
      | "medium"
      | "hard"
      | "mixed";

    return this.createQuestionSet(
      name,
      yamlData.metadata.description,
      difficulty,
      yamlData.metadata.category,
      yamlData.questions
    );
  }
}

export const questionSetService = new QuestionSetService();
