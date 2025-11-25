import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AchievementToastComponent } from './components/achievement-toast/achievement-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, AchievementToastComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-achievement-toast></app-achievement-toast>
  `,
  styles: [`
    .main-content {
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'BetterMe';
}