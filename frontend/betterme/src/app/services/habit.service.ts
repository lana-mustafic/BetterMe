// habit.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Habit, HabitCompletion, HabitStats, HabitCategory, LevelSystem, CreateHabitRequest, UpdateHabitRequest, CompleteHabitRequest } from '../models/habit.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/habits`;

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

  // CRUD Operations
  getHabits(): Observable<Habit[]> {
    return this.http.get<{ success: boolean; data: Habit[] }>(this.apiUrl)
      .pipe(map(response => response.data));
  }

  getHabitById(id: string): Observable<Habit> {
    return this.http.get<{ success: boolean; data: Habit }>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  createHabit(habitData: CreateHabitRequest): Observable<Habit> {
    return this.http.post<{ success: boolean; data: Habit }>(this.apiUrl, habitData)
      .pipe(map(response => response.data));
  }

  updateHabit(id: string, updates: UpdateHabitRequest): Observable<Habit> {
    return this.http.put<{ success: boolean; data: Habit }>(`${this.apiUrl}/${id}`, updates)
      .pipe(map(response => response.data));
  }

  deleteHabit(id: string): Observable<void> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  // Habit Completion
  completeHabit(habitId: string, request?: CompleteHabitRequest): Observable<HabitCompletion> {
    return this.http.post<{ success: boolean; data: HabitCompletion }>(
      `${this.apiUrl}/${habitId}/complete`, 
      request || {}
    ).pipe(map(response => response.data));
  }

  uncompleteHabit(habitId: string, date: string): Observable<void> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${habitId}/completions/${date}`)
      .pipe(map(() => undefined));
  }

  getHabitCompletions(habitId: string, startDate: string, endDate: string): Observable<HabitCompletion[]> {
    return this.http.get<{ success: boolean; data: HabitCompletion[] }>(
      `${this.apiUrl}/${habitId}/completions?start=${startDate}&end=${endDate}`
    ).pipe(map(response => response.data));
  }

  // Analytics
  getHabitStats(): Observable<HabitStats> {
    return this.http.get<{ success: boolean; data: HabitStats }>(`${this.apiUrl}/stats`)
      .pipe(map(response => response.data));
  }

  getLevelSystem(): Observable<LevelSystem> {
    return this.http.get<{ success: boolean; data: LevelSystem }>(`${this.apiUrl}/level-system`)
      .pipe(map(response => response.data));
  }

  getTodayHabits(): Observable<Habit[]> {
    return this.http.get<{ success: boolean; data: Habit[] }>(`${this.apiUrl}/today`)
      .pipe(map(response => response.data));
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

    return Math.min((completionsInPeriod / habit.targetCount) * 100, 100);
  }

  private getCurrentPeriodStart(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.getFullYear(), now.getMonth(), diff);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return now;
    }
  }
}