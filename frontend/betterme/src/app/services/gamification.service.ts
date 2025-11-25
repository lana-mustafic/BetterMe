import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';
import {
  GamificationStats,
  LevelSystem,
  Achievement,
  LeaderboardEntry,
  ApiResponse
} from '../models/gamification.model';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/gamification`;

  private statsSubject = new BehaviorSubject<GamificationStats | null>(null);
  public stats$ = this.statsSubject.asObservable();

  private levelSystemSubject = new BehaviorSubject<LevelSystem | null>(null);
  public levelSystem$ = this.levelSystemSubject.asObservable();

  private newAchievementsSubject = new BehaviorSubject<Achievement[]>([]);
  public newAchievements$ = this.newAchievementsSubject.asObservable();

  private authHeaders(): { headers: { [key: string]: string } } {
    const token = this.authService.getToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  getStats(): Observable<ApiResponse<GamificationStats>> {
    return this.http.get<ApiResponse<GamificationStats>>(
      `${this.apiUrl}/stats`,
      this.authHeaders()
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.statsSubject.next(response.data);
        }
      }),
      catchError(err => {
        console.error('Error fetching gamification stats:', err);
        throw err;
      })
    );
  }

  getLevelSystem(): Observable<ApiResponse<LevelSystem>> {
    return this.http.get<ApiResponse<LevelSystem>>(
      `${this.apiUrl}/level-system`,
      this.authHeaders()
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.levelSystemSubject.next(response.data);
        }
      }),
      catchError(err => {
        console.error('Error fetching level system:', err);
        throw err;
      })
    );
  }

  getAchievements(includeUnlocked: boolean = true): Observable<ApiResponse<Achievement[]>> {
    return this.http.get<ApiResponse<Achievement[]>>(
      `${this.apiUrl}/achievements?includeUnlocked=${includeUnlocked}`,
      this.authHeaders()
    ).pipe(
      catchError(err => {
        console.error('Error fetching achievements:', err);
        throw err;
      })
    );
  }

  getNewAchievements(): Observable<ApiResponse<Achievement[]>> {
    return this.http.get<ApiResponse<Achievement[]>>(
      `${this.apiUrl}/achievements/new`,
      this.authHeaders()
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.newAchievementsSubject.next(response.data);
        }
      }),
      catchError(err => {
        console.error('Error fetching new achievements:', err);
        throw err;
      })
    );
  }

  markAchievementAsRead(achievementId: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(
      `${this.apiUrl}/achievements/${achievementId}/mark-read`,
      {},
      this.authHeaders()
    ).pipe(
      tap(() => {
        // Update local state - remove from new achievements
        const current = this.newAchievementsSubject.value;
        const updated = current.filter(a => a.id !== achievementId);
        this.newAchievementsSubject.next(updated);
      }),
      catchError(err => {
        console.error('Error marking achievement as read:', err);
        throw err;
      })
    );
  }

  getLeaderboard(limit: number = 10): Observable<ApiResponse<LeaderboardEntry[]>> {
    return this.http.get<ApiResponse<LeaderboardEntry[]>>(
      `${this.apiUrl}/leaderboard?limit=${limit}`,
      this.authHeaders()
    ).pipe(
      catchError(err => {
        console.error('Error fetching leaderboard:', err);
        throw err;
      })
    );
  }

  refreshStats(): void {
    this.getStats().subscribe();
    this.getLevelSystem().subscribe();
    this.getNewAchievements().subscribe();
  }
}

