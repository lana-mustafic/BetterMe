import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">

        <div class="nav-brand" routerLink="/">
          <img src="assets/brand/betterme-logo.png" alt="BetterMe Logo" class="brand-logo" />
        </div>

        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/tasks" routerLinkActive="active">Tasks</a>

          <!-- ✅ Use async pipe to read current user -->
          <ng-container *ngIf="authService.currentUser$ | async as user; else guestLinks">
            <div class="user-section">
              <a routerLink="/profile" class="user-info">👋 {{ user.displayName }}</a>
              <button (click)="onLogout()" class="btn-logout">Logout</button>
            </div>
          </ng-container>

          <ng-template #guestLinks>
            <div class="auth-links">
              <a routerLink="/login" routerLinkActive="active">Login</a>
              <a routerLink="/register" routerLinkActive="active">Register</a>
            </div>
          </ng-template>

        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* (keep all your existing CSS unchanged — copy-paste from before) */
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
