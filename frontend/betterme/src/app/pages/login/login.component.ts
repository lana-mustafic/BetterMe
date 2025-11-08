import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="login-container">
          <!-- Main Login Card -->
          <div class="login-card glass-card">
            <!-- Header Section -->
            <div class="auth-header">
              <h1 class="gradient-text">Welcome Back</h1>
              <p class="subtitle">Sign in to continue your productivity journey</p>
            </div>

            <!-- Login Form -->
            <form (ngSubmit)="onLogin()" class="auth-form">
              <!-- Email Field -->
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input 
                  type="email"
                  class="form-control"
                  placeholder="your.email@example.com"
                  [(ngModel)]="email"
                  name="email"
                  required
                />
              </div>

              <!-- Password Field -->
              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="password-input-container">
                  <input 
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control password-input"
                    placeholder="Enter your password"
                    [(ngModel)]="password"
                    name="password"
                    required
                  />
                  <button 
                    type="button" 
                    class="password-toggle"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <span class="password-toggle-icon">
                      {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Forgot Password Link -->
              <div class="forgot-password">
                <a routerLink="/forgot-password" class="forgot-link">
                  🔒 Forgot your password?
                </a>
              </div>

              <!-- Error Message -->
              @if (errorMessage) {
                <div class="error-card">
                  <div class="error-icon">⚠️</div>
                  <div class="error-content">
                    <h3>Login Failed</h3>
                    <p>{{ errorMessage }}</p>
                  </div>
                </div>
              }

              <!-- Submit Button -->
              <button 
                class="btn btn-primary btn-full" 
                type="submit" 
                [disabled]="isLoading"
              >
                @if (isLoading) {
                  <div class="button-loading">
                    <div class="button-spinner"></div>
                    Signing you in...
                  </div>
                } @else {
                  <span class="btn-icon">🔐</span>
                  Sign In
                }
              </button>
            </form>

            <!-- Divider -->
            <div class="divider">
              <span>New to our platform?</span>
            </div>

            <!-- Register Link -->
            <a routerLink="/register" class="btn btn-secondary btn-full">
              <span class="btn-icon">🚀</span>
              Create New Account
            </a>

            <!-- Demo Account Notice -->
            <div class="demo-notice">
              <details class="demo-details">
                <summary class="demo-summary">🎯 Demo Account</summary>
                <div class="demo-content">
                  <p><strong>Email:</strong> demo@example.com</p>
                  <p><strong>Password:</strong> demo123</p>
                  <p class="demo-hint">Try out the app with our demo account!</p>
                </div>
              </details>
            </div>
          </div>

          <!-- Features Card -->
          <div class="features-card glass-card">
            <h3 class="features-title">Continue Your Journey</h3>
            <div class="features-list">
              <div class="feature-item">
                <span class="feature-icon">📝</span>
                <div class="feature-content">
                  <div class="feature-title">Task Management</div>
                  <div class="feature-description">Pick up where you left off with your tasks</div>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <div class="feature-content">
                  <div class="feature-title">Progress Insights</div>
                  <div class="feature-description">Track your productivity and achievements</div>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔄</span>
                <div class="feature-content">
                  <div class="feature-title">Smart Reminders</div>
                  <div class="feature-description">Never miss important deadlines</div>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🌟</span>
                <div class="feature-content">
                  <div class="feature-title">Personalized Experience</div>
                  <div class="feature-description">Your tasks, your way</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
    }

    .background-shapes {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      right: -100px;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      bottom: 100px;
      left: -50px;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 20%;
    }

    .container {
      position: relative;
      z-index: 1;
    }

    .login-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: center;
      min-height: 100vh;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .gradient-text {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.1rem;
      font-weight: 500;
    }

    .auth-form {
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
    }

    .form-control {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-size: 16px;
      color: white;
      transition: all 0.3s ease;
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .form-control:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }

    /* Password Input Container */
    .password-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input {
      padding-right: 50px;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .password-toggle:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .password-toggle:active {
      transform: scale(0.95);
    }

    .password-toggle-icon {
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    /* Forgot Password */
    .forgot-password {
      text-align: right;
      margin-bottom: 1.5rem;
    }

    .forgot-link {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .forgot-link:hover {
      color: white;
      text-decoration: underline;
    }

    /* Buttons */
    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      text-decoration: none;
      justify-content: center;
    }

    .btn-full {
      width: 100%;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .button-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .button-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Error State */
    .error-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .error-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .error-content h3 {
      color: white;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .error-content p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      margin: 0;
    }

    /* Divider */
    .divider {
      text-align: center;
      margin: 1.5rem 0;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
    }

    .divider span {
      background: rgba(255, 255, 255, 0.1);
      padding: 0 1rem;
      position: relative;
    }

    /* Demo Account */
    .demo-notice {
      margin-top: 1.5rem;
    }

    .demo-details {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      overflow: hidden;
    }

    .demo-summary {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      list-style: none;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      transition: background 0.3s ease;
    }

    .demo-summary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .demo-summary::-webkit-details-marker {
      display: none;
    }

    .demo-content {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
    }

    .demo-content p {
      margin: 0.5rem 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .demo-hint {
      font-style: italic;
      color: rgba(255, 255, 255, 0.6) !important;
      font-size: 0.8rem !important;
    }

    /* Features Card */
    .features-card {
      height: fit-content;
    }

    .features-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .feature-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .feature-title {
      color: white;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .feature-description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .login-container {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
      }

      .gradient-text {
        font-size: 2rem;
      }

      .features-card {
        order: -1;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 20px;
      }

      .gradient-text {
        font-size: 1.8rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .btn {
        padding: 0.875rem 1.5rem;
      }

      .password-toggle {
        right: 8px;
        padding: 6px;
      }
    }
  `]
})
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/tasks']);
        },
        error: (err) => {
          this.isLoading = false;
          
          const msg = err.error?.message?.toLowerCase() || '';

          // ✅ Detect "email not verified" message and redirect user
          if (msg.includes('verify')) {
            this.router.navigate(['/verify-email'], {
              queryParams: { email: this.email }
            });
            return;
          }

          this.errorMessage = err.error?.message || "Login failed.";
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}