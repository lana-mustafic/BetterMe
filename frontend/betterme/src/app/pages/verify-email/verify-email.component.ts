import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="verify-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="verify-container">
          <div class="verify-card glass-card">
            <!-- Loading State -->
            @if (isLoading) {
              <div class="loading-section">
                <div class="loading-spinner">
                  <div class="spinner-ring"></div>
                </div>
                <h2 class="gradient-text">Verifying Your Email</h2>
                <p>Please wait while we confirm your account...</p>
              </div>
            }

            <!-- Success State -->
            @if (success && !isLoading) {
              <div class="success-state">
                <div class="success-icon">🎉</div>
                <h2 class="gradient-text">Email Verified Successfully!</h2>
                <p>Your account is now active and ready to use. You can log in and start organizing your tasks.</p>
                <div class="success-actions">
                  <a routerLink="/login" class="btn btn-primary">
                    <span class="btn-icon">🔐</span>
                    Continue to Login
                  </a>
                  <a routerLink="/" class="btn btn-secondary">
                    <span class="btn-icon">🏠</span>
                    Go to Homepage
                  </a>
                </div>
              </div>
            }

            <!-- Error State -->
            @if (errorMessage && !isLoading) {
              <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2 class="gradient-text">Verification Failed</h2>
                <p>{{ errorMessage }}</p>
                <div class="error-actions">
                  <a routerLink="/login" class="btn btn-primary">
                    <span class="btn-icon">↩️</span>
                    Back to Login
                  </a>
                  <a routerLink="/register" class="btn btn-secondary">
                    <span class="btn-icon">📝</span>
                    Create New Account
                  </a>
                  @if (showResendOption) {
                    <button class="btn btn-outline" (click)="resendVerification()" [disabled]="resendLoading">
                      @if (resendLoading) {
                        <div class="button-loading">
                          <div class="button-spinner"></div>
                          Sending...
                        </div>
                      } @else {
                        <span class="btn-icon">🔄</span>
                        Resend Verification Email
                      }
                    </button>
                  }
                </div>
                @if (resendSuccess) {
                  <div class="resend-success">
                    ✅ New verification email sent! Please check your inbox.
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
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
      width: 200px;
      height: 200px;
      top: -50px;
      right: -50px;
    }

    .shape-2 {
      width: 150px;
      height: 150px;
      bottom: 100px;
      left: -30px;
    }

    .shape-3 {
      width: 100px;
      height: 100px;
      top: 50%;
      right: 10%;
    }

    .verify-container {
      max-width: 500px;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .gradient-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
    }

    .loading-spinner {
      margin-bottom: 2rem;
    }

    .spinner-ring {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(102, 126, 234, 0.2);
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    .success-icon, .error-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }

    h2 {
      margin-bottom: 1rem;
      font-size: 1.8rem;
    }

    p {
      color: #4a5568;
      margin-bottom: 2rem;
      line-height: 1.6;
      font-size: 1.1rem;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }

    .btn-secondary {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border: 2px solid rgba(102, 126, 234, 0.2);
    }

    .btn-outline {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    .success-actions, .error-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
      margin-top: 2rem;
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
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .resend-success {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
      color: #16a34a;
      font-weight: 500;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .glass-card {
        padding: 2rem 1.5rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      .success-actions, .error-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 20px;
      }

      h2 {
        font-size: 1.3rem;
      }

      p {
        font-size: 1rem;
      }
    }
  `]
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isLoading = true;
  success = false;
  errorMessage: string | null = null;
  showResendOption = false;
  resendLoading = false;
  resendSuccess = false;
  private userEmail: string | null = null;

  ngOnInit() {
    this.userEmail = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    console.log('🔍 Email verification started with params:', { email: this.userEmail, token });

    if (!this.userEmail || !token) {
      this.isLoading = false;
      this.errorMessage = "Verification link is incomplete. Please check your email and try again.";
      this.showResendOption = false;
      console.error('❌ Missing email or token parameters');
      return;
    }

    this.verifyEmail(this.userEmail, token);
  }

private verifyEmail(email: string, token: string) {
  const verifyUrl = `${environment.apiUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  
  console.log('🔍 Environment:', environment);
  console.log('🔍 Calling verification API:', verifyUrl);
  console.log('🔍 Production mode:', environment.production);

  this.http.get<{ message: string }>(verifyUrl)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('✅ Email verification successful:', response);
        this.isLoading = false;
        this.success = true;
        this.showResendOption = false;
      },
      error: (error) => {
        console.error('❌ Email verification failed:', error);
        console.error('❌ Error details:', error);
        this.isLoading = false;
        this.showResendOption = true;
        
        if (error.status === 400) {
          this.errorMessage = error.error?.message || "This verification link is invalid or has expired.";
        } else if (error.status === 404) {
          this.errorMessage = "User not found. Please check if you used the correct email address.";
        } else if (error.status === 0) {
          this.errorMessage = `Unable to connect to the server. Please check your internet connection. (Trying to reach: ${environment.apiUrl})`;
        } else {
          this.errorMessage = error.error?.message || "Verification failed. Please try again or contact support.";
        }
      }
    });
}

  resendVerification() {
    if (!this.userEmail) return;

    this.resendLoading = true;
    this.resendSuccess = false;

    this.http.post(`${environment.apiUrl}/auth/resend-verification`, { email: this.userEmail })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.resendLoading = false;
          this.resendSuccess = true;
          console.log('✅ Resend verification successful:', response);
        },
        error: (error) => {
          this.resendLoading = false;
          console.error('❌ Resend verification failed:', error);
          this.errorMessage = "Failed to resend verification email. Please try again later.";
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}