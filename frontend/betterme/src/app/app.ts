import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AchievementToastComponent } from './components/achievement-toast/achievement-toast.component';
import { OnboardingTourComponent } from './components/onboarding-tour/onboarding-tour.component';
import { KeyboardShortcutsHelpComponent } from './components/keyboard-shortcuts-help/keyboard-shortcuts-help.component';
import { ThemeService } from './services/theme.service';
import { KeyboardShortcutsService } from './services/keyboard-shortcuts.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    AchievementToastComponent,
    OnboardingTourComponent,
    KeyboardShortcutsHelpComponent
  ],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-achievement-toast></app-achievement-toast>
    <app-onboarding-tour></app-onboarding-tour>
    <app-keyboard-shortcuts-help></app-keyboard-shortcuts-help>
  `,
  styles: [`
    .main-content {
      padding: 20px;
      transition: all 0.3s ease;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'BetterMe';
  
  private themeService = inject(ThemeService);
  private keyboardShortcutsService = inject(KeyboardShortcutsService);

  ngOnInit() {
    // Initialize theme service (it auto-applies theme)
    // Initialize keyboard shortcuts
    this.keyboardShortcutsService.registerCommonShortcuts();
  }
}