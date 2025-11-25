import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../services/gamification.service';
import { LevelProgressBarComponent } from '../level-progress-bar/level-progress-bar.component';
import { GamificationStats } from '../../models/gamification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gamification-stats',
  standalone: true,
  imports: [CommonModule, LevelProgressBarComponent],
  template: `
    <div class="gamification-stats">
      <div class="stats-header">
        <h2 class="stats-title">Your Progress</h2>
      </div>

      <!-- Level Progress -->
      <div class="stats-section">
        <app-level-progress-bar></app-level-progress-bar>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.currentStreak || 0 }}</div>
            <div class="stat-label">Day Streak</div>
            @if (stats && stats.bestStreak > stats.currentStreak) {
              <div class="stat-sublabel">Best: {{ stats.bestStreak }}</div>
            }
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.tasksCompleted || 0 }}</div>
            <div class="stat-label">Tasks Completed</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💎</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalPoints || 0 }}</div>
            <div class="stat-label">Total Points</div>
            @if (stats) {
              <div class="stat-sublabel">
                Tasks: {{ stats.taskPoints }} | Habits: {{ stats.habitPoints }}
              </div>
            }
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalAchievements || 0 }}</div>
            <div class="stat-label">Achievements</div>
            @if (stats && stats.newAchievements > 0) {
              <div class="stat-sublabel new-badge">
                {{ stats.newAchievements }} new!
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="stats-actions">
        <button class="btn-action" (click)="viewAchievements()">
          <span class="btn-icon">🏆</span>
          View Achievements
        </button>
        <button class="btn-action" (click)="viewLeaderboard()">
          <span class="btn-icon">📊</span>
          Leaderboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .gamification-stats {
      background: rgba(30, 30, 30, 0.6);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .stats-header {
      margin-bottom: 1.5rem;
    }

    .stats-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s;
    }

    .stat-card:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .stat-icon {
      font-size: 2.5rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      color: white;
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .stat-sublabel {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .stat-sublabel.new-badge {
      color: #fbbf24;
      font-weight: 600;
    }

    .stats-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn-action {
      flex: 1;
      min-width: 150px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
      border: 1px solid rgba(102, 126, 234, 0.4);
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s;
    }

    .btn-action:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
      border-color: rgba(102, 126, 234, 0.6);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .gamification-stats {
        padding: 1.5rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-actions {
        flex-direction: column;
      }

      .btn-action {
        width: 100%;
      }
    }
  `]
})
export class GamificationStatsComponent implements OnInit, OnDestroy {
  private gamificationService = inject(GamificationService);
  private subscription = new Subscription();

  stats: GamificationStats | null = null;

  ngOnInit() {
    this.subscription.add(
      this.gamificationService.stats$.subscribe(stats => {
        this.stats = stats;
      })
    );

    // Load initial data
    this.gamificationService.getStats().subscribe();
    this.gamificationService.getLevelSystem().subscribe();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  viewAchievements() {
    // TODO: Navigate to achievements page or open modal
    console.log('View achievements');
  }

  viewLeaderboard() {
    // TODO: Navigate to leaderboard page or open modal
    console.log('View leaderboard');
  }
}

