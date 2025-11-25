import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../services/gamification.service';
import { LevelSystem } from '../../models/gamification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-level-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="level-progress-container">
      <div class="level-header">
        <div class="level-info">
          <span class="level-label">Level</span>
          <span class="level-number">{{ levelSystem?.level || 1 }}</span>
        </div>
        <div class="points-info">
          <span class="points">{{ levelSystem?.points || 0 }}</span>
          <span class="points-label">points</span>
        </div>
      </div>
      
      <div class="progress-bar-wrapper">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            [style.width.%]="levelSystem?.progress || 0"
            [style.background]="getProgressGradient()"
          ></div>
        </div>
        <div class="progress-text">
          <span>{{ levelSystem?.pointsToNextLevel || 0 }} points to next level</span>
        </div>
      </div>

      @if (getLastReward()) {
        <div class="rewards-preview">
          <span class="rewards-label">Unlocked:</span>
          <span class="rewards-text">{{ getLastReward() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .level-progress-container {
      background: rgba(30, 30, 30, 0.6);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .level-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .level-info {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .level-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .level-number {
      color: white;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .points-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .points {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .points-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.75rem;
    }

    .progress-bar-wrapper {
      margin-bottom: 0.75rem;
    }

    .progress-bar {
      width: 100%;
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .progress-text {
      text-align: center;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
    }

    .rewards-preview {
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .rewards-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
    }

    .rewards-text {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.85rem;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .level-progress-container {
        padding: 1rem;
      }

      .level-number {
        font-size: 1.5rem;
      }

      .points {
        font-size: 1.25rem;
      }
    }
  `]
})
export class LevelProgressBarComponent implements OnInit, OnDestroy {
  @Input() compact: boolean = false;
  
  private gamificationService = inject(GamificationService);
  private subscription = new Subscription();

  levelSystem: LevelSystem | null = null;

  ngOnInit() {
    this.subscription.add(
      this.gamificationService.levelSystem$.subscribe(levelSystem => {
        this.levelSystem = levelSystem;
      })
    );

    // Load initial data
    this.gamificationService.getLevelSystem().subscribe();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getProgressGradient(): string {
    const progress = this.levelSystem?.progress || 0;
    if (progress >= 100) {
      return 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
    }
    return 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
  }

  getLastReward(): string | null {
    if (this.levelSystem?.rewards && this.levelSystem.rewards.length > 0) {
      return this.levelSystem.rewards[this.levelSystem.rewards.length - 1];
    }
    return null;
  }
}

