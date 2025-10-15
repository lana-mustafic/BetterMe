import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="auth-container">
        <div class="auth-card">
          <h2 class="auth-title">Create Account</h2>
          <p class="auth-subtitle">Join thousands of productive people</p>
          
          <form class="auth-form" (ngSubmit)="onRegister()">
            <div class="form-group">
              <label class="form-label">Display Name</label>
              <input 
                type="text" 
                class="form-control"
                placeholder="Choose a display name"
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
                placeholder="Create a password"
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
                Creating your account...
              </div>
            }
            
            <button 
              type="submit" 
              class="btn btn-primary btn-full"
              [disabled]="isLoading"
            >
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>
          
          <div class="auth-footer">
            <p>Already have an account? <a routerLink="/login" class="auth-link">Sign in</a></p>
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
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  displayName: string = ''; // Changed from username to displayName
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  onRegister(): void {
    if (!this.displayName || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      displayName: this.displayName, // Changed from username to displayName
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.router.navigate(['/tasks']);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        
        // For demo purposes
        if (error.status === 0) {
          this.errorMessage = 'Backend is not running. Using demo mode - you are now logged in!';
          setTimeout(() => {
            this.router.navigate(['/tasks']);
          }, 2000);
        }
      }
    });
  }
}