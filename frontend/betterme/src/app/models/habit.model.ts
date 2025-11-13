export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  bestStreak: number;
  completedDates: string[]; // Store as ISO string dates
  targetCount: number; // How many times per period (e.g., 3 times per week)
  currentCount: number; // Current period count
  category: string;
  color: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number; // Points earned per completion
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  reminderTime?: string; // Optional reminder time
  tags: string[];
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
  notes?: string;
  mood?: 'terrible' | 'bad' | 'neutral' | 'good' | 'excellent';
  pointsEarned: number;
}

export interface HabitStats {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  successRate: number;
  totalPoints: number;
  level: number;
  weeklyProgress: { date: string; completions: number }[];
  categoryBreakdown: { category: string; count: number; completed: number }[];
}

export interface HabitCategory {
  name: string;
  color: string;
  icon: string;
  description: string;
}

export interface LevelSystem {
  level: number;
  points: number;
  pointsToNextLevel: number;
  progress: number;
  rewards: string[];
}