import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="'Switch to ' + (themeService.isDarkTheme() ? 'light' : 'dark') + ' theme'"
      [title]="'Switch to ' + (themeService.isDarkTheme() ? 'light' : 'dark') + ' theme'"
    >
      <div class="toggle-icons">
        <span class="sun-icon" [class.active]="!themeService.isDarkTheme()">☀️</span>
        <span class="moon-icon" [class.active]="themeService.isDarkTheme()">🌙</span>
      </div>
      <span class="toggle-text">
        {{ themeService.isDarkTheme() ? 'Dark' : 'Light' }}
      </span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: var(--text-primary);
    }

    .theme-toggle:hover {
      background: var(--bg-tertiary);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }

    .toggle-icons {
      position: relative;
      width: 20px;
      height: 20px;
    }

    .sun-icon, .moon-icon {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.5;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .sun-icon.active, .moon-icon.active {
      opacity: 1;
      transform: scale(1.1);
    }

    .sun-icon:not(.active) {
      transform: scale(0.8) rotate(-90deg);
    }

    .moon-icon:not(.active) {
      transform: scale(0.8) rotate(90deg);
    }

    .toggle-text {
      font-weight: 600;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .toggle-text {
        display: none;
      }
      
      .theme-toggle {
        padding: 0.5rem;
      }
    }
  `]
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}