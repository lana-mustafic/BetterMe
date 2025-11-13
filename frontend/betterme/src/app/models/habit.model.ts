// habit.model.ts
export interface Habit {
  id: string;
  userId: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  bestStreak: number;
  completedDates: string[]; // ISO string dates
  targetCount: number;
  currentCount: number;
  category: string;
  color: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  reminderTime?: string;
  tags: string[];
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: number;
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

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  category: string;
  color: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  reminderTime?: string;
  tags: string[];
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  targetCount?: number;
  category?: string;
  color?: string;
  icon?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  isActive?: boolean;
  reminderTime?: string;
  tags?: string[];
}

export interface CompleteHabitRequest {
  notes?: string;
  mood?: string;
}