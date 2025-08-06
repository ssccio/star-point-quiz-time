export interface PracticeSession {
  id: string;
  playerName: string;
  teamId: string;
  questionSetId: string;
  questionSetTitle: string;
  startTime: string;
  endTime?: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  duration?: number; // in minutes
  completed: boolean;
}

export interface PracticeSignup {
  id: string;
  playerName: string;
  email?: string;
  teamId: string;
  preferredTime?: string;
  notes?: string;
  signupTime: string;
  attended: boolean;
}

class PracticeService {
  private readonly SESSIONS_KEY = "practice_sessions";
  private readonly SIGNUPS_KEY = "practice_signups";

  // Practice Session Management
  startPracticeSession(
    playerName: string,
    teamId: string,
    questionSetId: string,
    questionSetTitle: string,
    totalQuestions: number
  ): string {
    const session: PracticeSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerName,
      teamId,
      questionSetId,
      questionSetTitle,
      startTime: new Date().toISOString(),
      totalQuestions,
      correctAnswers: 0,
      accuracy: 0,
      completed: false,
    };

    const sessions = this.getSessions();
    sessions.push(session);
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));

    return session.id;
  }

  updatePracticeSession(
    sessionId: string,
    correctAnswers: number,
    completed: boolean = false
  ): void {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex === -1) return;

    const session = sessions[sessionIndex];
    session.correctAnswers = correctAnswers;
    session.accuracy = Math.round(
      (correctAnswers / session.totalQuestions) * 100
    );
    session.completed = completed;

    if (completed && !session.endTime) {
      session.endTime = new Date().toISOString();
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      session.duration = Math.round((end.getTime() - start.getTime()) / 60000); // minutes
    }

    sessions[sessionIndex] = session;
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }

  getSessions(): PracticeSession[] {
    try {
      const stored = localStorage.getItem(this.SESSIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getSessionsByTeam(teamId: string): PracticeSession[] {
    return this.getSessions().filter((session) => session.teamId === teamId);
  }

  getSessionsByPlayer(playerName: string): PracticeSession[] {
    return this.getSessions().filter(
      (session) => session.playerName.toLowerCase() === playerName.toLowerCase()
    );
  }

  // Practice Signup Management
  addSignup(
    playerName: string,
    email: string | undefined,
    teamId: string,
    preferredTime?: string,
    notes?: string
  ): string {
    const signup: PracticeSignup = {
      id: `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerName,
      email,
      teamId,
      preferredTime,
      notes,
      signupTime: new Date().toISOString(),
      attended: false,
    };

    const signups = this.getSignups();
    signups.push(signup);
    localStorage.setItem(this.SIGNUPS_KEY, JSON.stringify(signups));

    return signup.id;
  }

  getSignups(): PracticeSignup[] {
    try {
      const stored = localStorage.getItem(this.SIGNUPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  markAttendance(signupId: string, attended: boolean): void {
    const signups = this.getSignups();
    const signupIndex = signups.findIndex((s) => s.id === signupId);

    if (signupIndex === -1) return;

    signups[signupIndex].attended = attended;
    localStorage.setItem(this.SIGNUPS_KEY, JSON.stringify(signups));
  }

  // Statistics
  getTeamStats(teamId: string): {
    totalSessions: number;
    completedSessions: number;
    averageAccuracy: number;
    totalPlayers: number;
  } {
    const sessions = this.getSessionsByTeam(teamId);
    const completedSessions = sessions.filter((s) => s.completed);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageAccuracy:
        completedSessions.length > 0
          ? Math.round(
              completedSessions.reduce((sum, s) => sum + s.accuracy, 0) /
                completedSessions.length
            )
          : 0,
      totalPlayers: new Set(sessions.map((s) => s.playerName.toLowerCase()))
        .size,
    };
  }

  getOverallStats(): {
    totalSessions: number;
    totalPlayers: number;
    averageAccuracy: number;
    mostActiveTeam: string;
  } {
    const sessions = this.getSessions();
    const completedSessions = sessions.filter((s) => s.completed);

    // Count sessions by team
    const teamCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      teamCounts[s.teamId] = (teamCounts[s.teamId] || 0) + 1;
    });

    const mostActiveTeam = Object.entries(teamCounts).reduce(
      (max, [team, count]) => (count > max.count ? { team, count } : max),
      { team: "", count: 0 }
    ).team;

    return {
      totalSessions: sessions.length,
      totalPlayers: new Set(sessions.map((s) => s.playerName.toLowerCase()))
        .size,
      averageAccuracy:
        completedSessions.length > 0
          ? Math.round(
              completedSessions.reduce((sum, s) => sum + s.accuracy, 0) /
                completedSessions.length
            )
          : 0,
      mostActiveTeam,
    };
  }

  // Export data for admin use
  exportSessions(): string {
    const sessions = this.getSessions();
    const csv = [
      "Player Name,Team,Question Set,Start Time,End Time,Duration (min),Questions,Correct,Accuracy,Completed",
      ...sessions.map((s) =>
        [
          s.playerName,
          s.teamId,
          s.questionSetTitle,
          s.startTime,
          s.endTime || "",
          s.duration || "",
          s.totalQuestions,
          s.correctAnswers,
          s.accuracy + "%",
          s.completed ? "Yes" : "No",
        ].join(",")
      ),
    ].join("\n");

    return csv;
  }

  exportSignups(): string {
    const signups = this.getSignups();
    const csv = [
      "Player Name,Email,Team,Preferred Time,Notes,Signup Time,Attended",
      ...signups.map((s) =>
        [
          s.playerName,
          s.email || "",
          s.teamId,
          s.preferredTime || "",
          s.notes || "",
          s.signupTime,
          s.attended ? "Yes" : "No",
        ].join(",")
      ),
    ].join("\n");

    return csv;
  }
}

export const practiceService = new PracticeService();
