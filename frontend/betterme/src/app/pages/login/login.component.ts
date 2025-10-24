import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="auth-container">
        <div class="auth-card">
          <h2 class="auth-title">Welcome Back</h2>
          <p class="auth-subtitle">Sign in to your account</p>
          
          <form class="auth-form" (ngSubmit)="onLogin()">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input 
                type="email" 
                class="form-control"
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                [(ngModel)]="password" 
                name="password" 
                required
              />
            </div>

            @if (errorMessage) {
              <div class="error-message">
                {{ errorMessage }}
              </div>
            }

            @if (isLoading) {
              <div class="loading">
                Signing in...
              </div>
            }
            
            <button 
              type="submit" 
              class="btn btn-primary btn-full"
              [disabled]="isLoading"
            >
              {{ isLoading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
          
          <div class="auth-footer">
            <p>Don't have an account? <a routerLink="/register" class="auth-link">Sign up</a></p>
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
      padding: 2rem 0;
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }

    .auth-title {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .auth-subtitle {
      color: #666;
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-form {
      margin-bottom: 2rem;
    }

    .btn-full {
      width: 100%;
    }

    .auth-footer {
      text-align: center;
      color: #666;
    }

    .auth-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-link:hover {
      text-decoration: underline;
    }

    .error-message {
      background: #fee;
      color: #c33;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 1rem;
      text-align: center;
      border: 1px solid #fcc;
    }

    .loading {
      text-align: center;
      color: #667eea;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const returnUrl = this.getReturnUrl();
        this.router.navigate([returnUrl || '/tasks']);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        
        // For demo purposes - remove this when backend is ready
        if (error.status === 0) {
          this.errorMessage = 'Backend is not running. This is a demo.';
        }
      }
    });
  }

  private getReturnUrl(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('returnUrl') || '';
  }
}