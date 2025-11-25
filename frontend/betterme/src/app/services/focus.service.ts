import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FocusSession {
  id: number;
  taskId?: number;
  taskTitle?: string;
  sessionType: 'work' | 'break';
  durationMinutes: number;
  actualDurationMinutes: number;
  startedAt: string;
  completedAt?: string;
  isCompleted: boolean;
  wasInterrupted: boolean;
  notes?: string;
}

export interface StartSessionRequest {
  taskId?: number;
  sessionType?: 'work' | 'break';
  durationMinutes?: number;
}

export interface FocusSessionStats {
  totalSessions: number;
  completedSessions: number;
  interruptedSessions: number;
  totalFocusMinutes: number;
  averageSessionDuration: number;
  longestSession: number;
  sessionsByTask: { [key: string]: number };
  dailyFocusTime: DailyFocusTime[];
}

export interface DailyFocusTime {
  date: string;
  focusMinutes: number;
  sessionCount: number;
}

export interface PomodoroSettings {
  workDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  playSoundOnComplete: boolean;
  showNotifications: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FocusService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/focussession`;

  private activeSessionSubject = new BehaviorSubject<FocusSession | null>(null);
  public activeSession$ = this.activeSessionSubject.asObservable();

  startSession(request: StartSessionRequest): Observable<FocusSession> {
    return this.http.post<FocusSession>(`${this.apiUrl}/start`, request).pipe(
      tap(session => this.activeSessionSubject.next(session))
    );
  }

  getActiveSession(): Observable<FocusSession> {
    return this.http.get<FocusSession>(`${this.apiUrl}/active`).pipe(
      tap(session => this.activeSessionSubject.next(session)),
      catchError(error => {
        // 404 is expected when there's no active session
        if (error.status === 404) {
          this.activeSessionSubject.next(null);
          return of(null as any); // Return null to indicate no active session
        }
        return throwError(() => error);
      })
    );
  }

  completeSession(sessionId: number, wasInterrupted: boolean = false, notes?: string): Observable<FocusSession> {
    return this.http.post<FocusSession>(`${this.apiUrl}/${sessionId}/complete`, {
      wasInterrupted,
      notes
    }).pipe(
      tap(() => this.activeSessionSubject.next(null))
    );
  }

  getSessions(startDate?: Date, endDate?: Date): Observable<FocusSession[]> {
    let params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const query = params.toString();
    return this.http.get<FocusSession[]>(`${this.apiUrl}${query ? '?' + query : ''}`);
  }

  getStats(startDate?: Date, endDate?: Date): Observable<FocusSessionStats> {
    let params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const query = params.toString();
    return this.http.get<FocusSessionStats>(`${this.apiUrl}/stats${query ? '?' + query : ''}`);
  }

  getSettings(): Observable<PomodoroSettings> {
    return this.http.get<PomodoroSettings>(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: PomodoroSettings): Observable<PomodoroSettings> {
    return this.http.put<PomodoroSettings>(`${this.apiUrl}/settings`, settings);
  }

  clearActiveSession(): void {
    this.activeSessionSubject.next(null);
  }
}

