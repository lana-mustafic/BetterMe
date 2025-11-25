import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isActive()) {
      <div class="tour-overlay" (click)="skipTour()">
        <div class="tour-highlight" [style]="getHighlightStyle()"></div>
        <div class="tour-tooltip" [style]="getTooltipStyle()" (click)="$event.stopPropagation()">
          <div class="tooltip-header">
            <div class="step-indicator">
              Step {{ currentStepIndex() + 1 }} of {{ steps.length }}
            </div>
            <button class="skip-btn" (click)="skipTour()">Skip</button>
          </div>
          <h3 class="tooltip-title">{{ currentStep()?.title }}</h3>
          <p class="tooltip-description">{{ currentStep()?.description }}</p>
          <div class="tooltip-actions">
            @if (currentStepIndex() > 0) {
              <button class="btn-secondary" (click)="previousStep()">Previous</button>
            }
            @if (currentStepIndex() < steps.length - 1) {
              <button class="btn-primary" (click)="nextStep()">Next</button>
            } @else {
              <button class="btn-primary" (click)="completeTour()">Get Started</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tour-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      pointer-events: all;
    }

    .tour-highlight {
      position: absolute;
      border: 3px solid rgba(102, 126, 234, 0.8);
      border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7),
                  0 0 20px rgba(102, 126, 234, 0.5);
      pointer-events: none;
      transition: all 0.3s ease;
      z-index: 1;
    }

    .tour-tooltip {
      position: absolute;
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 2;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .step-indicator {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .skip-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .skip-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .tooltip-title {
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.75rem 0;
    }

    .tooltip-description {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }

    .tooltip-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `]
})
export class OnboardingTourComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  
  isActive = signal(false);
  currentStepIndex = signal(0);
  currentStep = signal<TourStep | null>(null);
  highlightRect = signal<DOMRect | null>(null);
  tooltipPosition = signal<{ top: number; left: number } | null>(null);

  steps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to BetterMe! 🎉',
      description: 'Let\'s take a quick tour to help you get started. We\'ll show you the key features in just a few steps.',
      position: 'center'
    },
    {
      id: 'tasks',
      title: 'Manage Your Tasks',
      description: 'Create, organize, and track your tasks. Use priorities, categories, and due dates to stay on top of everything.',
      target: 'a[routerLink="/tasks"]',
      position: 'bottom',
      action: () => this.router.navigate(['/tasks'])
    },
    {
      id: 'habits',
      title: 'Build Good Habits',
      description: 'Track your daily habits and build streaks. Consistency is key to personal growth!',
      target: 'a[routerLink="/habits"]',
      position: 'bottom'
    },
    {
      id: 'focus',
      title: 'Focus Mode',
      description: 'Use focus mode to eliminate distractions and work in focused time blocks.',
      target: 'a[routerLink="/focus"]',
      position: 'bottom'
    },
    {
      id: 'theme',
      title: 'Customize Your Experience',
      description: 'Toggle between light and dark modes, and choose your favorite accent color.',
      target: 'app-theme-toggle',
      position: 'left'
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Press "?" to see all available keyboard shortcuts. Speed up your workflow!',
      position: 'center'
    }
  ];

  ngOnInit() {
    // Check if user has completed tour
    const hasCompletedTour = localStorage.getItem('betterme-tour-completed');
    if (!hasCompletedTour) {
      // Start tour after a short delay
      setTimeout(() => {
        this.startTour();
      }, 1000);
    }
  }

  ngOnDestroy() {
    // Cleanup
  }

  startTour(): void {
    this.isActive.set(true);
    this.currentStepIndex.set(0);
    this.updateStep();
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current?.action) {
      current.action();
    }

    if (this.currentStepIndex() < this.steps.length - 1) {
      this.currentStepIndex.set(this.currentStepIndex() + 1);
      setTimeout(() => this.updateStep(), 300);
    }
  }

  previousStep(): void {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.set(this.currentStepIndex() - 1);
      setTimeout(() => this.updateStep(), 300);
    }
  }

  skipTour(): void {
    this.completeTour();
  }

  completeTour(): void {
    this.isActive.set(false);
    localStorage.setItem('betterme-tour-completed', 'true');
  }

  private updateStep(): void {
    const step = this.steps[this.currentStepIndex()];
    this.currentStep.set(step);

    // Wait a bit for DOM to update if navigating
    setTimeout(() => {
      if (step.target && step.position !== 'center') {
        const element = document.querySelector(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          this.highlightRect.set(rect);
          this.updateTooltipPosition(rect, step.position || 'bottom');
        } else {
          // Element not found, center the tooltip
          this.highlightRect.set(null);
          this.tooltipPosition.set({
            top: window.innerHeight / 2,
            left: window.innerWidth / 2
          });
        }
      } else {
        // Center position
        this.highlightRect.set(null);
        this.tooltipPosition.set({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2
        });
      }
    }, 100);
  }

  private updateTooltipPosition(rect: DOMRect, position: 'top' | 'bottom' | 'left' | 'right'): void {
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const spacing = 20;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - spacing;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - spacing;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + spacing;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

    this.tooltipPosition.set({ top, left });
  }

  getHighlightStyle(): string {
    const rect = this.highlightRect();
    if (!rect) return 'display: none;';
    
    return `
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
    `;
  }

  getTooltipStyle(): string {
    const pos = this.tooltipPosition();
    if (!pos) return 'display: none;';
    
    return `
      top: ${pos.top}px;
      left: ${pos.left}px;
      transform: translate(-50%, -50%);
    `;
  }
}

