import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { Habit, HabitCompletion, HabitStats, HabitCategory, LevelSystem } from '../models/habit.model';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = `${environment.apiUrl}/habits`;
  private habitsSubject = new BehaviorSubject<Habit[]>([]);
  public habits$ = this.habitsSubject.asObservable();

  // Gamification settings
  private readonly POINTS_PER_COMPLETION = 10;
  private readonly STREAK_BONUS_MULTIPLIER = 0.1; // 10% bonus per 7-day streak
  private readonly LEVEL_THRESHOLDS = [100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];

  // Default categories
  private defaultCategories: HabitCategory[] = [
    {
      name: 'Health & Fitness',
      color: '#4ade80',
      icon: '💪',
      description: 'Exercise, nutrition, and wellness habits'
    },
    {
      name: 'Productivity',
      color: '#3b82f6',
      icon: '⚡',
      description: 'Work, study, and productivity habits'
    },
    {
      name: 'Mindfulness',
      color: '#8b5cf6',
      icon: '🧘',
      description: 'Meditation, journaling, and mental health'
    },
    {
      name: 'Learning',
      color: '#f59e0b',
      icon: '📚',
      description: 'Reading, courses, and skill development'
    },
    {
      name: 'Social',
      color: '#ec4899',
      icon: '👥',
      description: 'Relationships and social activities'
    },
    {
      name: 'Personal Care',
      color: '#06b6d4',
      icon: '✨',
      description: 'Self-care and personal maintenance'
    }
  ];

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {});
  }

  // CRUD Operations
  getHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(this.apiUrl, { headers: this.authHeaders() }).pipe(
      tap(habits => this.habitsSubject.next(habits))
    );
  }

  getHabitById(id: string): Observable<Habit> {
    return this.http.get<Habit>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() });
  }

  createHabit(habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streak' | 'bestStreak' | 'completedDates' | 'currentCount'>): Observable<Habit> {
    const newHabit = {
      ...habitData,
      id: this.generateId(),
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      currentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.http.post<Habit>(this.apiUrl, newHabit, { headers: this.authHeaders() }).pipe(
      tap(habit => {
        const currentHabits = this.habitsSubject.value;
        this.habitsSubject.next([...currentHabits, habit]);
      })
    );
  }

  updateHabit(id: string, updates: Partial<Habit>): Observable<Habit> {
    return this.http.put<Habit>(`${this.apiUrl}/${id}`, updates, { headers: this.authHeaders() }).pipe(
      tap(updatedHabit => {
        const currentHabits = this.habitsSubject.value;
        const updatedHabits = currentHabits.map(habit => 
          habit.id === id ? { ...habit, ...updates, updatedAt: new Date().toISOString() } : habit
        );
        this.habitsSubject.next(updatedHabits);
      })
    );
  }

  deleteHabit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() }).pipe(
      tap(() => {
        const currentHabits = this.habitsSubject.value;
        const updatedHabits = currentHabits.filter(habit => habit.id !== id);
        this.habitsSubject.next(updatedHabits);
      })
    );
  }

  // Habit Completion & Gamification
  completeHabit(habitId: string, notes?: string, mood?: string): Observable<HabitCompletion> {
    const completion: Omit<HabitCompletion, 'id'> = {
      habitId,
      completedAt: new Date().toISOString(),
      notes,
      mood: mood as any,
      pointsEarned: this.calculatePoints(habitId)
    };

    return this.http.post<HabitCompletion>(`${this.apiUrl}/${habitId}/complete`, completion, { headers: this.authHeaders() }).pipe(
      tap(() => {
        // Update local state
        this.updateHabitStreak(habitId, true);
      })
    );
  }

  uncompleteHabit(habitId: string, date: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${habitId}/completions/${date}`, { headers: this.authHeaders() }).pipe(
      tap(() => {
        // Update local state
        this.updateHabitStreak(habitId, false);
      })
    );
  }

  // Analytics & Statistics
  getHabitStats(): Observable<HabitStats> {
    return this.habits$.pipe(
      map(habits => this.calculateHabitStats(habits))
    );
  }

  getLevelSystem(): Observable<LevelSystem> {
    return this.getHabitStats().pipe(
      map(stats => this.calculateLevelSystem(stats.totalPoints))
    );
  }

  getTodayHabits(): Observable<Habit[]> {
    return this.habits$.pipe(
      map(habits => habits.filter(habit => this.isHabitDueToday(habit)))
    );
  }

  getHabitCompletions(habitId: string, startDate: string, endDate: string): Observable<HabitCompletion[]> {
    return this.http.get<HabitCompletion[]>(
      `${this.apiUrl}/${habitId}/completions?start=${startDate}&end=${endDate}`,
      { headers: this.authHeaders() }
    );
  }

  // Utility Methods
  getCategories(): HabitCategory[] {
    return [...this.defaultCategories];
  }

  isHabitDueToday(habit: Habit): boolean {
    const today = new Date().toISOString().split('T')[0];
    const lastCompleted = habit.completedDates[habit.completedDates.length - 1];
    
    if (!lastCompleted) return true;

    const lastCompletedDate = new Date(lastCompleted);
    const todayDate = new Date();

    switch (habit.frequency) {
      case 'daily':
        return lastCompletedDate.toDateString() !== todayDate.toDateString();
      case 'weekly':
        const daysSinceCompletion = Math.floor((todayDate.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCompletion >= 7;
      case 'monthly':
        return lastCompletedDate.getMonth() !== todayDate.getMonth() || lastCompletedDate.getFullYear() !== todayDate.getFullYear();
      default:
        return true;
    }
  }

  getHabitCompletionRate(habit: Habit): number {
    const periodStart = this.getCurrentPeriodStart(habit.frequency);
    const completionsInPeriod = habit.completedDates.filter(date => 
      new Date(date) >= periodStart
    ).length;

    return (completionsInPeriod / habit.targetCount) * 100;
  }

  // Private Methods
  private generateId(): string {
    return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculatePoints(habitId: string): number {
    const habits = this.habitsSubject.value;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return this.POINTS_PER_COMPLETION;

    let points = this.POINTS_PER_COMPLETION;
    
    // Streak bonus
    if (habit.streak >= 7) {
      const streakBonus = Math.floor(habit.streak / 7) * this.STREAK_BONUS_MULTIPLIER * points;
      points += streakBonus;
    }

    // Difficulty multiplier
    switch (habit.difficulty) {
      case 'medium':
        points *= 1.5;
        break;
      case 'hard':
        points *= 2;
        break;
    }

    return Math.round(points);
  }

  private updateHabitStreak(habitId: string, completed: boolean): void {
    const habits = this.habitsSubject.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);
    
    if (habitIndex === -1) return;

    const habit = habits[habitIndex];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = habit.streak;
    let newCompletedDates = [...habit.completedDates];

    if (completed) {
      // Add today's completion
      if (!newCompletedDates.includes(today)) {
        newCompletedDates.push(today);
      }

      // Check if we're continuing a streak
      if (newCompletedDates.includes(yesterday) || habit.streak === 0) {
        newStreak++;
      } else {
        newStreak = 1; // Reset streak if broken
      }
    } else {
      // Remove completion and adjust streak
      newCompletedDates = newCompletedDates.filter(date => date !== today);
      
      // Check if we broke the streak
      if (!newCompletedDates.includes(yesterday)) {
        newStreak = Math.max(0, newStreak - 1);
      }
    }

    const updatedHabit = {
      ...habit,
      streak: newStreak,
      bestStreak: Math.max(newStreak, habit.bestStreak),
      completedDates: newCompletedDates,
      currentCount: newCompletedDates.filter(date => 
        new Date(date) >= this.getCurrentPeriodStart(habit.frequency)
      ).length,
      updatedAt: new Date().toISOString()
    };

    const updatedHabits = [...habits];
    updatedHabits[habitIndex] = updatedHabit;
    this.habitsSubject.next(updatedHabits);
  }

  private calculateHabitStats(habits: Habit[]): HabitStats {
    const activeHabits = habits.filter(h => h.isActive);
    const totalCompletions = activeHabits.reduce((sum, habit) => sum + habit.completedDates.length, 0);
    const currentStreak = Math.max(...activeHabits.map(h => h.streak));
    const longestStreak = Math.max(...activeHabits.map(h => h.bestStreak));
    const totalPoints = activeHabits.reduce((sum, habit) => 
      sum + (habit.completedDates.length * this.POINTS_PER_COMPLETION), 0
    );

    // Calculate success rate (completions vs targets for current period)
    const totalTarget = activeHabits.reduce((sum, habit) => sum + habit.targetCount, 0);
    const totalCurrentCompletions = activeHabits.reduce((sum, habit) => sum + habit.currentCount, 0);
    const successRate = totalTarget > 0 ? (totalCurrentCompletions / totalTarget) * 100 : 0;

    // Generate weekly progress (last 7 days)
    const weeklyProgress = this.generateWeeklyProgress(activeHabits);

    // Category breakdown
    const categoryBreakdown = this.defaultCategories.map(category => {
      const categoryHabits = activeHabits.filter(h => h.category === category.name);
      return {
        category: category.name,
        count: categoryHabits.length,
        completed: categoryHabits.reduce((sum, habit) => sum + habit.currentCount, 0)
      };
    });

    return {
      totalHabits: habits.length,
      activeHabits: activeHabits.length,
      totalCompletions,
      currentStreak,
      longestStreak,
      successRate,
      totalPoints,
      level: this.calculateLevel(totalPoints),
      weeklyProgress,
      categoryBreakdown
    };
  }

  private calculateLevelSystem(totalPoints: number): LevelSystem {
    const level = this.calculateLevel(totalPoints);
    const nextLevelThreshold = this.LEVEL_THRESHOLDS[level] || this.LEVEL_THRESHOLDS[this.LEVEL_THRESHOLDS.length - 1] * 2;
    const currentLevelThreshold = level > 0 ? this.LEVEL_THRESHOLDS[level - 1] : 0;
    const progress = ((totalPoints - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;

    const rewards = this.getLevelRewards(level);

    return {
      level,
      points: totalPoints,
      pointsToNextLevel: nextLevelThreshold - totalPoints,
      progress,
      rewards
    };
  }

  private calculateLevel(points: number): number {
    for (let i = 0; i < this.LEVEL_THRESHOLDS.length; i++) {
      if (points < this.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return this.LEVEL_THRESHOLDS.length + 1;
  }

  private getLevelRewards(level: number): string[] {
    const rewards = [
      'Welcome to habit tracking! 🎉',
      'Unlocked: Advanced statistics 📊',
      'Unlocked: Habit streaks 🔥',
      'Unlocked: Custom categories 🎨',
      'Unlocked: Progress charts 📈',
      'Unlocked: Achievement badges 🏆',
      'Unlocked: Export data 📤',
      'Unlocked: Advanced analytics 🔍',
      'Unlocked: Habit templates 📝',
      'Master Habit Builder! 🌟'
    ];

    return rewards.slice(0, level);
  }

  private generateWeeklyProgress(habits: Habit[]): { date: string; completions: number }[] {
    const progress = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const completions = habits.reduce((sum, habit) => 
        sum + (habit.completedDates.includes(dateString) ? 1 : 0), 0
      );

      progress.push({
        date: dateString,
        completions
      });
    }

    return progress;
  }

  private getCurrentPeriodStart(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
        return new Date(now.getFullYear(), now.getMonth(), diff);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return now;
    }
  }
}