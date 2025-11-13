import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
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

  // Demo data for testing (remove when you have a real backend)
  private demoHabits: Habit[] = [
    {
      id: 'habit_1',
      name: 'Morning Meditation',
      description: '10 minutes of meditation every morning',
      frequency: 'daily',
      streak: 5,
      bestStreak: 7,
      completedDates: this.getRecentDates(5),
      targetCount: 1,
      currentCount: 1,
      category: 'Mindfulness',
      color: '#8b5cf6',
      icon: '🧘',
      difficulty: 'easy',
      points: 10,
      isActive: true,
      createdAt: '2024-01-10T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      tags: ['meditation', 'mindfulness'],
      reminderTime: '08:00'
    },
    {
      id: 'habit_2',
      name: 'Evening Workout',
      description: '30 minutes of exercise',
      frequency: 'daily',
      streak: 3,
      bestStreak: 10,
      completedDates: this.getRecentDates(3),
      targetCount: 1,
      currentCount: 1,
      category: 'Health & Fitness',
      color: '#4ade80',
      icon: '💪',
      difficulty: 'medium',
      points: 15,
      isActive: true,
      createdAt: '2024-01-08T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      tags: ['exercise', 'fitness'],
      reminderTime: '18:00'
    },
    {
      id: 'habit_3',
      name: 'Read 20 Pages',
      description: 'Read at least 20 pages of a book',
      frequency: 'daily',
      streak: 7,
      bestStreak: 7,
      completedDates: this.getRecentDates(7),
      targetCount: 1,
      currentCount: 1,
      category: 'Learning',
      color: '#f59e0b',
      icon: '📚',
      difficulty: 'easy',
      points: 10,
      isActive: true,
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      tags: ['reading', 'learning'],
      reminderTime: '21:00'
    }
  ];

  constructor() {
    // Initialize with demo data
    this.habitsSubject.next([...this.demoHabits]);
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {});
  }

  // CRUD Operations
  getHabits(): Observable<Habit[]> {
    // Demo implementation - replace with real API call when backend is ready
    console.log('Fetching habits from demo data');
    return of([...this.demoHabits]).pipe(
      tap(habits => this.habitsSubject.next(habits)),
      catchError(error => {
        console.error('Error fetching habits:', error);
        // Fallback to demo data
        this.habitsSubject.next([...this.demoHabits]);
        return of([...this.demoHabits]);
      })
    );

    // Real implementation (uncomment when backend is ready):
    /*
    return this.http.get<Habit[]>(this.apiUrl, { headers: this.authHeaders() }).pipe(
      tap(habits => {
        console.log('Habits fetched from API:', habits);
        this.habitsSubject.next(habits);
      }),
      catchError(error => {
        console.error('Error fetching habits from API:', error);
        // Fallback to demo data
        this.habitsSubject.next([...this.demoHabits]);
        return of([...this.demoHabits]);
      })
    );
    */
  }

  getHabitById(id: string): Observable<Habit> {
    // Demo implementation
    const habit = this.demoHabits.find(h => h.id === id);
    if (habit) {
      return of({ ...habit });
    }
    return of(this.createEmptyHabit());

    // Real implementation:
    // return this.http.get<Habit>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() });
  }

  createHabit(habitData: any): Observable<Habit> {
    console.log('Creating habit with data:', habitData);
    
    const newHabit: Habit = {
      id: this.generateId(),
      name: habitData.name || 'New Habit',
      description: habitData.description || '',
      frequency: habitData.frequency || 'daily',
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      targetCount: habitData.targetCount || 1,
      currentCount: 0,
      category: habitData.category || 'Health & Fitness',
      color: habitData.color || '#4ade80',
      icon: habitData.icon || '✅',
      difficulty: habitData.difficulty || 'easy',
      points: habitData.points || 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: habitData.tags || [],
      reminderTime: habitData.reminderTime
    };

    // Demo implementation
    this.demoHabits.push(newHabit);
    this.habitsSubject.next([...this.demoHabits]);
    
    console.log('Habit created successfully:', newHabit);
    return of({ ...newHabit });

    // Real implementation:
    /*
    return this.http.post<Habit>(this.apiUrl, newHabit, { headers: this.authHeaders() }).pipe(
      tap(habit => {
        console.log('Habit created via API:', habit);
        const currentHabits = this.habitsSubject.value;
        this.habitsSubject.next([...currentHabits, habit]);
      }),
      catchError(error => {
        console.error('Error creating habit via API:', error);
        throw error;
      })
    );
    */
  }

  updateHabit(id: string, updates: Partial<Habit>): Observable<Habit> {
    console.log('Updating habit:', id, 'with data:', updates);
    
    // Demo implementation
    const index = this.demoHabits.findIndex(h => h.id === id);
    if (index !== -1) {
      const updatedHabit = { 
        ...this.demoHabits[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      this.demoHabits[index] = updatedHabit;
      this.habitsSubject.next([...this.demoHabits]);
      console.log('Habit updated successfully:', updatedHabit);
      return of({ ...updatedHabit });
    }
    
    console.error('Habit not found for update:', id);
    return of(this.createEmptyHabit());

    // Real implementation:
    /*
    return this.http.put<Habit>(`${this.apiUrl}/${id}`, updates, { headers: this.authHeaders() }).pipe(
      tap(updatedHabit => {
        console.log('Habit updated via API:', updatedHabit);
        const currentHabits = this.habitsSubject.value;
        const updatedHabits = currentHabits.map(habit => 
          habit.id === id ? { ...habit, ...updates, updatedAt: new Date().toISOString() } : habit
        );
        this.habitsSubject.next(updatedHabits);
      }),
      catchError(error => {
        console.error('Error updating habit via API:', error);
        throw error;
      })
    );
    */
  }

  deleteHabit(id: string): Observable<void> {
    console.log('Deleting habit:', id);
    
    // Demo implementation
    this.demoHabits = this.demoHabits.filter(habit => habit.id !== id);
    this.habitsSubject.next([...this.demoHabits]);
    console.log('Habit deleted successfully:', id);
    return of(void 0);

    // Real implementation:
    /*
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() }).pipe(
      tap(() => {
        console.log('Habit deleted via API:', id);
        const currentHabits = this.habitsSubject.value;
        const updatedHabits = currentHabits.filter(habit => habit.id !== id);
        this.habitsSubject.next(updatedHabits);
      }),
      catchError(error => {
        console.error('Error deleting habit via API:', error);
        throw error;
      })
    );
    */
  }

  // Habit Completion & Gamification
  completeHabit(habitId: string, notes?: string, mood?: string): Observable<HabitCompletion> {
    console.log('Completing habit:', habitId, 'Notes:', notes, 'Mood:', mood);
    
    const completion: HabitCompletion = {
      id: this.generateId(),
      habitId,
      completedAt: new Date().toISOString(),
      notes,
      mood: mood as any,
      pointsEarned: this.calculatePoints(habitId)
    };

    // Update the habit's streak and completed dates
    this.updateHabitStreak(habitId, true);
    
    console.log('Habit completed successfully:', completion);
    return of(completion);

    // Real implementation:
    /*
    return this.http.post<HabitCompletion>(`${this.apiUrl}/${habitId}/complete`, completion, { headers: this.authHeaders() }).pipe(
      tap(() => {
        console.log('Habit completed via API:', completion);
        this.updateHabitStreak(habitId, true);
      }),
      catchError(error => {
        console.error('Error completing habit via API:', error);
        throw error;
      })
    );
    */
  }

  uncompleteHabit(habitId: string, date: string): Observable<void> {
    console.log('Uncompleting habit:', habitId, 'for date:', date);
    
    this.updateHabitStreak(habitId, false);
    console.log('Habit uncompleted successfully');
    return of(void 0);

    // Real implementation:
    /*
    return this.http.delete<void>(`${this.apiUrl}/${habitId}/completions/${date}`, { headers: this.authHeaders() }).pipe(
      tap(() => {
        console.log('Habit uncompleted via API');
        this.updateHabitStreak(habitId, false);
      }),
      catchError(error => {
        console.error('Error uncompleting habit via API:', error);
        throw error;
      })
    );
    */
  }

  // Analytics & Statistics
  getHabitStats(): Observable<HabitStats> {
    return this.habits$.pipe(
      map(habits => {
        const stats = this.calculateHabitStats(habits);
        console.log('Calculated habit stats:', stats);
        return stats;
      }),
      catchError(error => {
        console.error('Error calculating habit stats:', error);
        return of(this.createEmptyStats());
      })
    );
  }

  getLevelSystem(): Observable<LevelSystem> {
    return this.getHabitStats().pipe(
      map(stats => {
        const levelSystem = this.calculateLevelSystem(stats.totalPoints);
        console.log('Calculated level system:', levelSystem);
        return levelSystem;
      }),
      catchError(error => {
        console.error('Error calculating level system:', error);
        return of(this.createEmptyLevelSystem());
      })
    );
  }

  getTodayHabits(): Observable<Habit[]> {
    return this.habits$.pipe(
      map(habits => {
        const todayHabits = habits.filter(habit => this.isHabitDueToday(habit));
        console.log('Today\'s habits:', todayHabits);
        return todayHabits;
      }),
      catchError(error => {
        console.error('Error getting today\'s habits:', error);
        return of([]);
      })
    );
  }

  getHabitCompletions(habitId: string, startDate: string, endDate: string): Observable<HabitCompletion[]> {
    console.log('Getting completions for habit:', habitId, 'from', startDate, 'to', endDate);
    
    // Demo implementation
    const habit = this.demoHabits.find(h => h.id === habitId);
    const completions: HabitCompletion[] = habit ? 
      habit.completedDates.map(date => ({
        id: this.generateId(),
        habitId,
        completedAt: date + 'T12:00:00.000Z',
        pointsEarned: this.calculatePoints(habitId)
      })) : [];
    
    return of(completions);

    // Real implementation:
    /*
    return this.http.get<HabitCompletion[]>(
      `${this.apiUrl}/${habitId}/completions?start=${startDate}&end=${endDate}`,
      { headers: this.authHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error fetching habit completions:', error);
        return of([]);
      })
    );
    */
  }

  // Utility Methods
  getCategories(): HabitCategory[] {
    return [...this.defaultCategories];
  }

  isHabitDueToday(habit: Habit): boolean {
    if (!habit.isActive) return false;

    const today = new Date().toISOString().split('T')[0];
    const lastCompleted = habit.completedDates[habit.completedDates.length - 1];
    
    // If never completed, it's due
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

    const rate = (completionsInPeriod / habit.targetCount) * 100;
    return Math.min(rate, 100); // Cap at 100%
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
    const currentStreak = activeHabits.length > 0 ? Math.max(...activeHabits.map(h => h.streak)) : 0;
    const longestStreak = activeHabits.length > 0 ? Math.max(...activeHabits.map(h => h.bestStreak)) : 0;
    const totalPoints = activeHabits.reduce((sum, habit) => 
      sum + (habit.completedDates.length * habit.points), 0
    );

    // Calculate success rate (completions vs targets for current period)
    let totalTarget = 0;
    let totalCurrentCompletions = 0;

    activeHabits.forEach(habit => {
      const periodStart = this.getCurrentPeriodStart(habit.frequency);
      const completionsInPeriod = habit.completedDates.filter(date => 
        new Date(date) >= periodStart
      ).length;
      totalTarget += habit.targetCount;
      totalCurrentCompletions += Math.min(completionsInPeriod, habit.targetCount);
    });

    const successRate = totalTarget > 0 ? (totalCurrentCompletions / totalTarget) * 100 : 0;

    // Generate weekly progress (last 7 days)
    const weeklyProgress = this.generateWeeklyProgress(activeHabits);

    // Category breakdown
    const categoryBreakdown = this.defaultCategories.map(category => {
      const categoryHabits = activeHabits.filter(h => h.category === category.name);
      const completed = categoryHabits.reduce((sum, habit) => {
        const periodStart = this.getCurrentPeriodStart(habit.frequency);
        const completionsInPeriod = habit.completedDates.filter(date => 
          new Date(date) >= periodStart
        ).length;
        return sum + Math.min(completionsInPeriod, habit.targetCount);
      }, 0);
      
      return {
        category: category.name,
        count: categoryHabits.length,
        completed
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
    const progress = totalPoints >= nextLevelThreshold ? 100 : 
                   ((totalPoints - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;

    const rewards = this.getLevelRewards(level);

    return {
      level,
      points: totalPoints,
      pointsToNextLevel: Math.max(0, nextLevelThreshold - totalPoints),
      progress: Math.min(progress, 100),
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

  // Helper methods for demo data
  private getRecentDates(count: number): string[] {
    const dates = [];
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  private createEmptyHabit(): Habit {
    return {
      id: '',
      name: '',
      description: '',
      frequency: 'daily',
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      targetCount: 1,
      currentCount: 0,
      category: 'Health & Fitness',
      color: '#4ade80',
      icon: '✅',
      difficulty: 'easy',
      points: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    };
  }

  private createEmptyStats(): HabitStats {
    return {
      totalHabits: 0,
      activeHabits: 0,
      totalCompletions: 0,
      currentStreak: 0,
      longestStreak: 0,
      successRate: 0,
      totalPoints: 0,
      level: 1,
      weeklyProgress: this.generateWeeklyProgress([]),
      categoryBreakdown: this.defaultCategories.map(category => ({
        category: category.name,
        count: 0,
        completed: 0
      }))
    };
  }

  private createEmptyLevelSystem(): LevelSystem {
    return {
      level: 1,
      points: 0,
      pointsToNextLevel: 100,
      progress: 0,
      rewards: []
    };
  }
}