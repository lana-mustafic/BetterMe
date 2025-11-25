import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">{{ icon }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description">{{ description }}</p>
      @if (actionLabel && actionCallback) {
        <button class="empty-action" (click)="actionCallback()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.75rem;
    }

    .empty-description {
      font-size: 1rem;
      line-height: 1.6;
      max-width: 500px;
      margin: 0 auto 1.5rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .empty-action {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 0.95rem;
    }

    .empty-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = '📭';
  @Input() title: string = 'No items found';
  @Input() description: string = 'Get started by creating your first item.';
  @Input() actionLabel?: string;
  @Input() actionCallback?: () => void;
}

