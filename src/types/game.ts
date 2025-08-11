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
  code: string;
  status: "waiting" | "active" | "finished";
  host_name: string;
  created_at: string;
}
