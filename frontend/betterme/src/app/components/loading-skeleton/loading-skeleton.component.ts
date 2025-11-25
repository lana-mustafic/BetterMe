import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" [class]="type" [style.width]="width" [style.height]="height" [style.border-radius]="borderRadius">
      <div class="skeleton-shimmer"></div>
    </div>
  `,
  styles: [`
    .skeleton {
      position: relative;
      background: rgba(255, 255, 255, 0.1);
      overflow: hidden;
      border-radius: 8px;
    }

    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .skeleton.text {
      height: 1em;
      width: 100%;
    }

    .skeleton.title {
      height: 1.5em;
      width: 60%;
    }

    .skeleton.paragraph {
      height: 1em;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .skeleton.paragraph:last-child {
      width: 80%;
    }

    .skeleton.avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .skeleton.card {
      width: 100%;
      height: 200px;
      border-radius: 12px;
    }

    .skeleton.button {
      width: 120px;
      height: 40px;
      border-radius: 8px;
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'text' | 'title' | 'paragraph' | 'avatar' | 'card' | 'button' | 'custom' = 'text';
  @Input() width: string = '100%';
  @Input() height: string = '1em';
  @Input() borderRadius: string = '8px';
}

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, LoadingSkeletonComponent],
  template: `
    <div class="skeleton-list">
      @for (item of items; track $index) {
        <div class="skeleton-item">
          <app-loading-skeleton type="avatar"></app-loading-skeleton>
          <div class="skeleton-content">
            <app-loading-skeleton type="title" width="60%"></app-loading-skeleton>
            <app-loading-skeleton type="text" width="80%"></app-loading-skeleton>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-item {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `]
})
export class SkeletonListComponent {
  @Input() count: number = 3;
  
  get items(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}

