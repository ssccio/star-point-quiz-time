export const APP_CONFIG = {
  // Game settings
  QUESTION_TIME_LIMIT: 60, // seconds
  TOTAL_QUESTIONS: 7,
  POINTS_PER_CORRECT: 20,
  FINAL_WAGER_MAX: 50,

  // Demo data settings (TODO: Replace with real backend data)
  USE_DEMO_DATA: true,

  // Default admin password (TODO: Replace with proper authentication)
  DEFAULT_ADMIN_PASSWORD: "admin123",

  // Error handling
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds

  // UI settings
  TOAST_DURATION: 5000, // milliseconds
  LOADING_DELAY: 300, // milliseconds before showing loading indicator
} as const;

// Demo team data (TODO: Replace with real backend integration)
export const DEMO_TEAM_DATA = {
  adah: {
    count: 4,
    connected: 3,
    names: ["Alice M.", "Bob K.", "Carol R.", "Dave S."],
  },
  ruth: { count: 3, connected: 3, names: ["Eve T.", "Frank L.", "Grace W."] },
  esther: {
    count: 5,
    connected: 4,
    names: ["Henry P.", "Iris J.", "Jack M.", "Kate N.", "Liam O."],
  },
  martha: {
    count: 3,
    connected: 2,
    names: ["Maya Q.", "Nick R.", "Olivia S."],
  },
  electa: {
    count: 4,
    connected: 4,
    names: ["Paul T.", "Quinn U.", "Rose V.", "Sam W."],
  },
} as const;

// Demo scores (TODO: Replace with real backend integration)
export const DEMO_SCORES = {
  adah: 150,
  ruth: 180,
  esther: 120,
  martha: 160,
  electa: 140,
} as const;

// Demo teammates (TODO: Replace with real backend integration)
export const DEMO_TEAMMATES = [
  { name: "Alice M.", hasAnswered: false },
  { name: "Bob K.", hasAnswered: false },
  { name: "Carol R.", hasAnswered: true },
] as const;
