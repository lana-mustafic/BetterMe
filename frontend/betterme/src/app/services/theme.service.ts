import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private darkTheme = signal<boolean>(false);

  constructor() {
    this.loadThemePreference();
  }

  isDarkTheme = computed(() => this.darkTheme());

  toggleTheme(): void {
    this.darkTheme.set(!this.darkTheme());
    this.saveThemePreference();
  }

  private loadThemePreference(): void {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) {
      this.darkTheme.set(JSON.parse(saved));
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkTheme.set(prefersDark);
    }
    this.applyTheme();
  }

  private saveThemePreference(): void {
    localStorage.setItem(this.THEME_KEY, JSON.stringify(this.darkTheme()));
    this.applyTheme();
  }

  private applyTheme(): void {
    const isDark = this.darkTheme();
    
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
    
    // Apply CSS variables to root
    this.applyCSSVariables(isDark);
  }

  private applyCSSVariables(isDark: boolean): void {
    const root = document.documentElement;
    
    if (isDark) {
      // Dark theme variables
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--bg-tertiary', '#404040');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#a0a0a0');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.5)');
    } else {
      // Light theme variables
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f9fa');
      root.style.setProperty('--bg-tertiary', '#e9ecef');
      root.style.setProperty('--text-primary', '#2d3748');
      root.style.setProperty('--text-secondary', '#718096');
      root.style.setProperty('--border-color', '#e2e8f0');
      root.style.setProperty('--shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');
    }
  }
}