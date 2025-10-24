import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <h1>✅ BetterMe</h1>
        </div>
        
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active">Home</a>
          <a routerLink="/tasks" routerLinkActive="active">Tasks</a>
          
          @if (authService.isLoggedIn() && authService.getCurrentUser()) {
            <div class="user-section">
              <a routerLink="/profile" routerLinkActive="active" class="user-info">
👋 {{ authService.getCurrentUser()?.displayName }}
              </a>
              <button (click)="onLogout()" class="btn-logout">Logout</button>
            </div>
          } @else {
            <div class="auth-links">
              <a routerLink="/login" routerLinkActive="active">Login</a>
              <a routerLink="/register" routerLinkActive="active">Register</a>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 70px;
    }

    .nav-brand h1 {
      color: #667eea;
      font-size: 1.8rem;
      font-weight: 700;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .nav-links a {
      color: #555;
      text-decoration: none;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .nav-links a:hover {
      color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .nav-links a.active {
      color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      color: #667eea !important;
      font-weight: 600;
    }

    .btn-logout {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }

    .btn-logout:hover {
      background: #c0392b;
    }

    .auth-links {
      display: flex;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .nav-links {
        gap: 1rem;
      }
      
      .user-section {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .auth-links {
        flex-direction: column;
        gap: 0.5rem;
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