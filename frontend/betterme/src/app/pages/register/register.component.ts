import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="auth-container">
        <div class="auth-card">
          <h2 class="auth-title">Create an Account</h2>
          <p class="auth-subtitle">Start your productivity journey</p>

          <form (ngSubmit)="onRegister()">
            <div class="form-group">
              <label class="form-label">Display Name</label>
              <input 
                type="text"
                class="form-control"
                placeholder="Your name"
                [(ngModel)]="displayName"
                name="displayName"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input 
                type="email"
                class="form-control"
                placeholder="Your email"
                [(ngModel)]="email"
                name="email"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input 
                type="password"
                class="form-control"
                placeholder="Choose a password"
                [(ngModel)]="password"
                name="password"
                required
              />
            </div>

            <div *ngIf="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <button class="btn btn-primary btn-full" type="submit" [disabled]="isLoading">
              {{ isLoading ? 'Creating account...' : 'Sign Up' }}
            </button>
          </form>

          <div class="auth-footer">
            <p>Already have an account? 
              <a routerLink="/login" class="auth-link">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .auth-card {
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .auth-title { text-align:center; font-weight:600; margin-bottom:0.5rem; }
    .auth-subtitle { text-align:center; margin-bottom:1.5rem; color:#666; }
    .form-group { margin-bottom:1rem; }
    .form-control { width:100%; padding:0.75rem; border-radius:8px; border:1px solid #ccc; }
    .btn-full { width:100%; margin-top:1rem; }
    .auth-footer { text-align:center; margin-top:1.5rem; color:#666; }
    .auth-link { color:#667eea; font-weight:600; cursor:pointer; }
    .error-message {
      background: #fee;
      color: #c33;
      padding: .75rem;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #fcc;
      margin-bottom: 1rem;
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  onRegister(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      displayName: this.displayName,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed.';
      }
    });
  }
}
