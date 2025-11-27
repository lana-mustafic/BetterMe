import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';
export type AccentColor = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'pink';

export interface ThemeConfig {
  theme: Theme;
  accentColor: AccentColor;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'betterme-theme';
  private readonly ACCENT_KEY = 'betterme-accent';

  // Signals for reactive theme management
  currentTheme = signal<Theme>(this.getStoredTheme());
  currentAccent = signal<AccentColor>(this.getStoredAccent());
  isDarkMode = signal<boolean>(this.calculateDarkMode());

  private accentColors: Record<AccentColor, { primary: string; secondary: string }> = {
    purple: { primary: '#667eea', secondary: '#764ba2' },
    blue: { primary: '#3b82f6', secondary: '#1e40af' },
    green: { primary: '#10b981', secondary: '#059669' },
    orange: { primary: '#f97316', secondary: '#ea580c' },
    red: { primary: '#ef4444', secondary: '#dc2626' },
    pink: { primary: '#ec4899', secondary: '#db2777' }
  };

  constructor() {
    // Apply theme on initialization
    this.applyTheme(this.currentTheme(), this.currentAccent());

    // Watch for theme changes
    effect(() => {
      const theme = this.currentTheme();
      const accent = this.currentAccent();
      const isDark = this.isDarkMode();
      // Re-apply theme when any of these change
      this.applyTheme(theme, accent);
      this.saveTheme(theme, accent);
    });

    // Watch for system theme changes if auto mode
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentTheme() === 'auto') {
          this.updateDarkMode();
        }
      });
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.updateDarkMode();
  }

  setAccentColor(color: AccentColor): void {
    this.currentAccent.set(color);
  }

  toggleTheme(): void {
    const current = this.currentTheme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('auto');
    } else {
      this.setTheme('light');
    }
  }

  private updateDarkMode(): void {
    const theme = this.currentTheme();
    let isDark = false;

    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'auto') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.isDarkMode.set(isDark);
  }

  private calculateDarkMode(): boolean {
    const theme = this.getStoredTheme();
    if (theme === 'dark') return true;
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  private applyTheme(theme: Theme, accent: AccentColor): void {
    const isDark = this.isDarkMode();
    const colors = this.accentColors[accent];
    const root = document.documentElement;

    if (isDark) {
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--bg-tertiary', '#3a3a3a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#e0e0e0');
      root.style.setProperty('--text-muted', '#a0a0a0');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--border-light', '#505050');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f9fa');
      root.style.setProperty('--bg-tertiary', '#e9ecef');
      root.style.setProperty('--text-primary', '#333333');
      root.style.setProperty('--text-secondary', '#555555');
      root.style.setProperty('--text-muted', '#6c757d');
      root.style.setProperty('--border-color', '#e1e5e9');
      root.style.setProperty('--border-light', '#dee2e6');
    }

    // Apply accent colors
    root.style.setProperty('--accent-primary', colors.primary);
    root.style.setProperty('--accent-secondary', colors.secondary);
    root.style.setProperty('--accent-hover', this.darkenColor(colors.primary, 10));
    
    // Use darker gradient in dark mode for better contrast
    if (isDark) {
      const darkPrimary = this.darkenColor(colors.primary, 30);
      const darkSecondary = this.darkenColor(colors.secondary, 30);
      root.style.setProperty('--bg-gradient', `linear-gradient(135deg, ${darkPrimary} 0%, ${darkSecondary} 100%)`);
      root.style.setProperty('--bg-gradient-reverse', `linear-gradient(135deg, ${darkSecondary} 0%, ${darkPrimary} 100%)`);
    } else {
      root.style.setProperty('--bg-gradient', `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`);
      root.style.setProperty('--bg-gradient-reverse', `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`);
    }

    // Update body class
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - percent * 2.55);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - percent * 2.55);
    const b = Math.max(0, (num & 0x0000FF) - percent * 2.55);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  private getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'auto';
    const stored = localStorage.getItem(this.THEME_KEY);
    return (stored as Theme) || 'auto';
  }

  private getStoredAccent(): AccentColor {
    if (typeof window === 'undefined') return 'purple';
    const stored = localStorage.getItem(this.ACCENT_KEY);
    return (stored as AccentColor) || 'purple';
  }

  private saveTheme(theme: Theme, accent: AccentColor): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.THEME_KEY, theme);
    localStorage.setItem(this.ACCENT_KEY, accent);
  }
}

