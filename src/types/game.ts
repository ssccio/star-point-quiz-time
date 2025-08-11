export interface Question {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  score: number;
}

export interface Game {
  id: string;
  game_code: string; // Changed from 'code' to 'game_code' to match database
  status: "waiting" | "active" | "finished";
  host_id: string; // Added missing field from database
  current_question?: number; // Added missing field from database
  created_at: string;
  updated_at?: string; // Added missing field from database
}
