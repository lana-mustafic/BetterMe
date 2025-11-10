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
      <div class="container">
        <div class="verify-container">
          <div class="verify-card glass-card">
            <!-- Loading State -->
            @if (isLoading) {
              <div class="loading-section">
                <div class="loading-spinner">
                  <div class="spinner-ring"></div>
                </div>
                <h2>Verifying Your Email</h2>
                <p>Please wait while we confirm your account</p>
              </div>
            }

            <!-- Success State -->
            @if (success && !isLoading) {
              <div class="success-state">
                <div class="success-icon">✅</div>
                <h2>Email Verified Successfully!</h2>
                <p>Your account is now active and ready to use.</p>
                <div class="success-actions">
                  <a routerLink="/login" class="btn btn-primary">
                    Continue to Login
                  </a>
                </div>
              </div>
            }

            <!-- Error State -->
            @if (errorMessage && !isLoading) {
              <div class="error-state">
                <div class="error-icon">❌</div>
                <h2>Verification Failed</h2>
                <p>{{ errorMessage }}</p>
                <div class="error-actions">
                  <a routerLink="/login" class="btn btn-primary">
                    Back to Login
                  </a>
                  <a routerLink="/signup" class="btn btn-secondary">
                    Create New Account
                  </a>
                </div>
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
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .verify-container {
      max-width: 500px;
      width: 100%;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .loading-spinner {
      margin-bottom: 2rem;
    }

    .spinner-ring {
      width: 60px;
      height: 60px;
      border: 4px solid #e2e8f0;
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
      color: #2d3748;
      margin-bottom: 1rem;
      font-size: 1.8rem;
    }

    p {
      color: #4a5568;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      margin: 0 8px;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    console.log('🔍 Email verification started with params:', { email, token });

    if (!email || !token) {
      this.isLoading = false;
      this.errorMessage = "Verification link is incomplete. Please check your email and try again.";
      console.error('❌ Missing email or token parameters');
      return;
    }

    const verifyUrl = `${environment.apiUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    console.log('🔍 Calling verification API:', verifyUrl);

    this.http.get(verifyUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Email verification successful:', response);
          this.isLoading = false;
          this.success = true;
        },
        error: (error) => {
          console.error('❌ Email verification failed:', error);
          this.isLoading = false;
          
          if (error.status === 400) {
            this.errorMessage = "This verification link is invalid or has expired. Please request a new verification email.";
          } else if (error.status === 404) {
            this.errorMessage = "User not found. Please check if you used the correct email address.";
          } else {
            this.errorMessage = "Verification failed. Please try again or contact support if the problem persists.";
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}