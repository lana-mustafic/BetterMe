import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme, AccentColor } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-toggle-container">
      <button class="theme-toggle-btn" (click)="showMenu = !showMenu" [attr.aria-label]="'Theme settings'">
        <span class="theme-icon">{{ getThemeIcon() }}</span>
        <span class="theme-label">{{ getThemeLabel() }}</span>
      </button>

      @if (showMenu) {
        <div class="theme-menu">
          <div class="theme-menu-section">
            <div class="menu-label">Theme</div>
            <div class="theme-options">
              <button 
                class="theme-option"
                [class.active]="themeService.currentTheme() === 'light'"
                (click)="setTheme('light')"
              >
                <span class="option-icon">☀️</span>
                <span class="option-label">Light</span>
              </button>
              <button 
                class="theme-option"
                [class.active]="themeService.currentTheme() === 'dark'"
                (click)="setTheme('dark')"
              >
                <span class="option-icon">🌙</span>
                <span class="option-label">Dark</span>
              </button>
              <button 
                class="theme-option"
                [class.active]="themeService.currentTheme() === 'auto'"
                (click)="setTheme('auto')"
              >
                <span class="option-icon">🔄</span>
                <span class="option-label">Auto</span>
              </button>
            </div>
          </div>

          <div class="theme-menu-section">
            <div class="menu-label">Accent Color</div>
            <div class="accent-options">
              @for (color of accentColors; track color.value) {
                <button 
                  class="accent-option"
                  [class.active]="themeService.currentAccent() === color.value"
                  (click)="setAccentColor(color.value)"
                  [style.background]="color.gradient"
                  [attr.aria-label]="color.label"
                >
                  <span class="accent-check" *ngIf="themeService.currentAccent() === color.value">✓</span>
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .theme-toggle-container {
      position: relative;
    }

    .theme-toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .theme-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .theme-icon {
      font-size: 1.1rem;
    }

    .theme-label {
      font-weight: 500;
    }

    .theme-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      background: var(--bg-primary);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      min-width: 200px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }

    .theme-menu-section {
      margin-bottom: 1rem;
    }

    .theme-menu-section:last-child {
      margin-bottom: 0;
    }

    .menu-label {
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }

    .theme-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .theme-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      text-align: left;
    }

    .theme-option:hover {
      background: var(--bg-tertiary);
      border-color: var(--accent-primary);
    }

    .theme-option.active {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: white;
    }

    .option-icon {
      font-size: 1.2rem;
    }

    .option-label {
      font-weight: 500;
    }

    .accent-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .accent-option {
      aspect-ratio: 1;
      border-radius: 8px;
      border: 2px solid transparent;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .accent-option:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .accent-option.active {
      border-color: var(--text-primary);
      box-shadow: 0 0 0 2px var(--accent-primary);
    }

    .accent-check {
      color: white;
      font-size: 1.2rem;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    @media (max-width: 768px) {
      .theme-menu {
        right: auto;
        left: 0;
      }
    }
  `]
})
export class ThemeToggleComponent implements OnInit {
  themeService = inject(ThemeService);
  showMenu = false;

  accentColors: Array<{ value: AccentColor; label: string; gradient: string }> = [
    { value: 'purple', label: 'Purple', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { value: 'blue', label: 'Blue', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
    { value: 'green', label: 'Green', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
    { value: 'orange', label: 'Orange', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
    { value: 'red', label: 'Red', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
    { value: 'pink', label: 'Pink', gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }
  ];

  ngOnInit() {
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-toggle-container')) {
        this.showMenu = false;
      }
    });
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this.showMenu = false;
  }

  setAccentColor(color: AccentColor): void {
    this.themeService.setAccentColor(color);
  }

  getThemeIcon(): string {
    const theme = this.themeService.currentTheme();
    if (theme === 'dark') return '🌙';
    if (theme === 'light') return '☀️';
    return '🔄';
  }

  getThemeLabel(): string {
    const theme = this.themeService.currentTheme();
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }
}

