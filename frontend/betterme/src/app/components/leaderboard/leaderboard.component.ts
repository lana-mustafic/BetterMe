import { Component, OnInit, OnDestroy, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../services/gamification.service';
import { LeaderboardEntry } from '../../models/gamification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="leaderboard">
      <div class="leaderboard-header">
        <h2 class="leaderboard-title">🏆 Leaderboard</h2>
        <button class="btn-close" (click)="close()" *ngIf="showCloseButton">×</button>
      </div>

      <div class="leaderboard-content">
        @if (loading) {
          <div class="loading">Loading leaderboard...</div>
        } @else if (leaderboard.length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📊</span>
            <p>No leaderboard data available</p>
          </div>
        } @else {
          <div class="leaderboard-list">
            @for (entry of leaderboard; track entry.userId; let i = $index) {
              <div 
                class="leaderboard-entry"
                [class.top-three]="entry.rank <= 3"
                [class.first]="entry.rank === 1"
                [class.second]="entry.rank === 2"
                [class.third]="entry.rank === 3"
              >
                <div class="rank-badge">
                  @if (entry.rank === 1) {
                    <span class="medal">🥇</span>
                  } @else if (entry.rank === 2) {
                    <span class="medal">🥈</span>
                  } @else if (entry.rank === 3) {
                    <span class="medal">🥉</span>
                  } @else {
                    <span class="rank-number">#{{ entry.rank }}</span>
                  }
                </div>

                <div class="entry-content">
                  <div class="entry-header">
                    <div class="user-name">{{ entry.userName }}</div>
                    <div class="user-level">Level {{ entry.level }}</div>
                  </div>
                  <div class="entry-stats">
                    <div class="stat-item">
                      <span class="stat-icon">💎</span>
                      <span class="stat-value">{{ entry.totalPoints }}</span>
                      <span class="stat-label">points</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-icon">🔥</span>
                      <span class="stat-value">{{ entry.currentStreak }}</span>
                      <span class="stat-label">day streak</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .leaderboard {
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .leaderboard-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .leaderboard-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .leaderboard-content {
      padding: 1rem;
      max-height: 600px;
      overflow-y: auto;
    }

    .loading, .empty-state {
      padding: 3rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .leaderboard-entry {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s;
    }

    .leaderboard-entry:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateX(4px);
    }

    .leaderboard-entry.top-three {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
      border-color: rgba(102, 126, 234, 0.3);
    }

    .leaderboard-entry.first {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 193, 7, 0.2) 100%);
      border-color: rgba(255, 215, 0, 0.4);
      box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);
    }

    .leaderboard-entry.second {
      background: linear-gradient(135deg, rgba(192, 192, 192, 0.2) 0%, rgba(169, 169, 169, 0.2) 100%);
      border-color: rgba(192, 192, 192, 0.4);
    }

    .leaderboard-entry.third {
      background: linear-gradient(135deg, rgba(205, 127, 50, 0.2) 0%, rgba(184, 115, 51, 0.2) 100%);
      border-color: rgba(205, 127, 50, 0.4);
    }

    .rank-badge {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .medal {
      font-size: 2rem;
      line-height: 1;
    }

    .rank-number {
      color: rgba(255, 255, 255, 0.6);
      font-size: 1.1rem;
      font-weight: 700;
    }

    .entry-content {
      flex: 1;
      min-width: 0;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .user-name {
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .user-level {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      background: rgba(102, 126, 234, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      border: 1px solid rgba(102, 126, 234, 0.3);
    }

    .entry-stats {
      display: flex;
      gap: 1.5rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-icon {
      font-size: 1.1rem;
    }

    .stat-value {
      color: white;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .leaderboard-header {
        padding: 1rem;
      }

      .leaderboard-content {
        padding: 0.75rem;
      }

      .leaderboard-entry {
        padding: 0.75rem 1rem;
      }

      .entry-stats {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  @Input() showCloseButton: boolean = false;
  @Output() closeEvent = new EventEmitter<void>();

  private gamificationService = inject(GamificationService);
  private subscription = new Subscription();

  leaderboard: LeaderboardEntry[] = [];
  loading: boolean = true;

  ngOnInit() {
    this.loadLeaderboard();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadLeaderboard(limit: number = 10) {
    this.loading = true;
    this.subscription.add(
      this.gamificationService.getLeaderboard(limit).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.leaderboard = response.data;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading leaderboard:', error);
          this.loading = false;
        }
      })
    );
  }

  close() {
    this.closeEvent.emit();
  }
}

