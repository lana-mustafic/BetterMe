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
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Home</a>
          <a routerLink="/my-day" routerLinkActive="active" class="nav-link">My Day</a>
          <a routerLink="/tasks" routerLinkActive="active" class="nav-link">Tasks</a>
          <a routerLink="/habits" routerLinkActive="active" class="nav-link">Habits</a>
          <a routerLink="/focus" routerLinkActive="active" class="nav-link">Focus</a> 

          <!-- ✅ Use async pipe to read current user -->
          <ng-container *ngIf="authService.currentUser$ | async as user; else guestLinks">
            <div class="user-section">
              <a routerLink="/profile" class="user-info">
                <span class="welcome-emoji">👋</span>
                <span class="user-name">{{ user.displayName }}</span>
              </a>
              <button (click)="onLogout()" class="btn-logout">Logout</button>
            </div>
          </ng-container>

          <ng-template #guestLinks>
            <div class="auth-links">
              <a routerLink="/login" routerLinkActive="active" class="auth-link">Login</a>
              <a routerLink="/register" routerLinkActive="active" class="auth-link auth-link--primary">Register</a>
            </div>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100px; /* Much taller navbar for huge logo */
    }

    .nav-brand {
      cursor: pointer;
      transition: transform 0.2s ease;
      display: flex;
      align-items: center;
      height: 100%;
    }

    .nav-brand:hover {
      transform: scale(1.05);
    }

    .brand-logo {
      height: 80px; /* HUGE increase - from 50px to 80px! */
      width: auto;
      filter: brightness(0) invert(1);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 0.75rem 1.25rem; /* Slightly larger padding to match bigger logo */
      border-radius: 8px;
      transition: all 0.3s ease;
      position: relative;
      font-size: 1.1rem; /* Slightly larger font */
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      text-decoration: none;
      padding: 0.75rem 1.25rem; /* Larger padding */
      border-radius: 8px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      font-size: 1.1rem; /* Larger font */
    }

    .user-info:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .welcome-emoji {
      font-size: 1.3rem; /* Larger emoji */
    }

    .user-name {
      font-weight: 500;
    }

    .btn-logout {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.75rem 1.75rem; /* Larger button */
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      font-size: 1.1rem; /* Larger font */
    }

    .btn-logout:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .auth-links {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .auth-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 0.75rem 1.75rem; /* Larger padding */
      border-radius: 8px;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.3);
      font-size: 1.1rem; /* Larger font */
    }

    .auth-link:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    .auth-link--primary {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .auth-link--primary:hover {
      background: rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .nav-container {
        padding: 0 1rem;
        height: 90px; /* Taller mobile navbar */
      }

      .nav-links {
        gap: 1rem;
      }

      .nav-link, .auth-link {
        padding: 0.6rem 1rem;
        font-size: 1rem;
      }

      .user-info {
        padding: 0.6rem 1rem;
        font-size: 1rem;
      }

      .btn-logout {
        padding: 0.6rem 1.25rem;
        font-size: 1rem;
      }

      .brand-logo {
        height: 65px; /* Much larger on mobile too */
      }
    }

    @media (max-width: 640px) {
      .nav-container {
        flex-direction: column;
        height: auto;
        padding: 1.5rem 1rem; /* More padding */
      }

      .nav-links {
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .user-section, .auth-links {
        flex-direction: column;
        width: 100%;
        align-items: stretch;
      }

      .user-info, .btn-logout, .auth-link {
        text-align: center;
        margin: 0.25rem 0;
      }

      .brand-logo {
        height: 70px; /* Even larger for very small screens */
        margin-bottom: 0.5rem;
      }
    }

    /* Extra large screens */
    @media (min-width: 1400px) {
      .brand-logo {
        height: 90px; /* Massive on big screens */
      }
      
      .nav-container {
        height: 110px; /* Even taller navbar */
      }
    }
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