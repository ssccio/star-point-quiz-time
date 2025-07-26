export const TEAMS = {
  adah: {
    id: "adah",
    name: "Adah",
    heroine: "Jephthah's Daughter",
    meaning: "Fidelity",
    color: "#0066CC",
  },
  ruth: {
    id: "ruth",
    name: "Ruth",
    heroine: "Ruth",
    meaning: "Constancy",
    color: "#FF6B35",
  },
  esther: {
    id: "esther",
    name: "Esther",
    heroine: "Queen Esther",
    meaning: "Loyalty",
    color: "#6B46C1",
  },
  martha: {
    id: "martha",
    name: "Martha",
    heroine: "Martha of Bethany",
    meaning: "Faith",
    color: "#16A085",
  },
  electa: {
    id: "electa",
    name: "Electa",
    heroine: "Electa the Elect Lady",
    meaning: "Love",
    color: "#E74C3C",
  },
} as const;

export const TEAM_COLORS = {
  adah: "#0066CC",
  ruth: "#FF6B35",
  esther: "#6B46C1",
  martha: "#16A085",
  electa: "#E74C3C",
} as const;

export const GAME_CONFIG = {
  QUESTION_TIME: 60,
  TOTAL_QUESTIONS: 7,
  POINTS_PER_CORRECT: 20,
  FINAL_WAGER_MAX: 50,
} as const;
