export interface GamificationStats {
  totalPoints: number;
  habitPoints: number;
  taskPoints: number;
  currentStreak: number;
  bestStreak: number;
  level: number;
  tasksCompleted: number;
  habitsCompleted: number;
  totalAchievements: number;
  newAchievements: number;
}

export interface LevelSystem {
  level: number;
  points: number;
  pointsToNextLevel: number;
  progress: number;
  rewards: string[];
}

export interface Achievement {
  id: number;
  achievementId: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: string;
  isNew: boolean;
}

export interface LeaderboardEntry {
  userId: number;
  userName: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  rank: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

