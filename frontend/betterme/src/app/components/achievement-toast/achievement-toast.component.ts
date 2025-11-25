import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../services/gamification.service';
import { Achievement } from '../../models/gamification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-achievement-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="achievement-toast-container">
      @for (achievement of visibleAchievements; track achievement.id) {
        <div 
          class="achievement-toast"
          [class.show]="achievement.show"
          [class.hide]="achievement.hiding"
          (click)="dismissAchievement(achievement)"
        >
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-content">
            <div class="achievement-title">Achievement Unlocked!</div>
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-description">{{ achievement.description }}</div>
          </div>
          <button class="btn-dismiss" (click)="dismissAchievement(achievement); $event.stopPropagation()">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .achievement-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      pointer-events: none;
    }

    .achievement-toast {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      gap: 1rem;
      opacity: 0;
      transform: translateX(400px);
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      pointer-events: auto;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .achievement-toast::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      animation: shine 3s infinite;
    }

    @keyframes shine {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .achievement-toast.show {
      opacity: 1;
      transform: translateX(0);
    }

    .achievement-toast.hide {
      opacity: 0;
      transform: translateX(400px);
    }

    .achievement-icon {
      font-size: 3rem;
      line-height: 1;
      animation: bounce 0.6s ease;
      flex-shrink: 0;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .achievement-content {
      flex: 1;
      min-width: 0;
    }

    .achievement-title {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.25rem;
    }

    .achievement-name {
      color: white;
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .achievement-description {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .btn-dismiss {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-dismiss:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    @media (max-width: 768px) {
      .achievement-toast-container {
        right: 10px;
        left: 10px;
        top: 10px;
      }

      .achievement-toast {
        min-width: auto;
        max-width: none;
        width: 100%;
      }
    }
  `]
})
export class AchievementToastComponent implements OnInit, OnDestroy {
  private gamificationService = inject(GamificationService);
  private subscription = new Subscription();

  visibleAchievements: (Achievement & { show: boolean; hiding: boolean })[] = [];

  ngOnInit() {
    // Subscribe to new achievements
    this.subscription.add(
      this.gamificationService.newAchievements$.subscribe(achievements => {
        achievements.forEach(achievement => {
          if (!this.visibleAchievements.find(a => a.id === achievement.id)) {
            const newAchievement = { ...achievement, show: false, hiding: false };
            this.visibleAchievements.push(newAchievement);
            
            // Trigger show animation
            setTimeout(() => {
              newAchievement.show = true;
            }, 100);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              this.dismissAchievement(newAchievement);
            }, 5000);
          }
        });
      })
    );

    // Load initial new achievements
    this.gamificationService.getNewAchievements().subscribe();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  dismissAchievement(achievement: Achievement & { show: boolean; hiding: boolean }) {
    achievement.hiding = true;
    achievement.show = false;
    
    // Mark as read in backend
    this.gamificationService.markAchievementAsRead(achievement.id).subscribe();

    // Remove from array after animation
    setTimeout(() => {
      const index = this.visibleAchievements.indexOf(achievement);
      if (index > -1) {
        this.visibleAchievements.splice(index, 1);
      }
    }, 400);
  }
}

