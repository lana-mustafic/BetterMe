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
      <!-- Simple debug header -->
      <div style="background: #667eea; color: white; padding: 15px; text-align: center;">
        <h1>BetterMe - Email Verification</h1>
        <p>API: {{ getApiUrl() }} | Production: {{ isProduction() }}</p>
      </div>

      <div class="container" style="max-width: 600px; margin: 50px auto; padding: 20px;">
        
        <!-- Loading State -->
        @if (isLoading) {
          <div style="text-align: center; padding: 40px;">
            <div style="width: 50px; height: 50px; border: 4px solid #667eea; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h2 style="color: #667eea;">Verifying Your Email</h2>
            <p>Please wait while we confirm your account...</p>
            <p style="font-size: 0.9rem; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">
              Calling: {{ currentApiCall }}
            </p>
          </div>
        }

        <!-- Success State -->
        @if (success && !isLoading) {
          <div style="text-align: center; padding: 40px; background: #f0fff4; border: 2px solid #68d391; border-radius: 10px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
            <h2 style="color: #2d3748; margin-bottom: 15px;">Email Verified Successfully!</h2>
            <p style="color: #4a5568; margin-bottom: 30px; font-size: 1.1rem;">
              Your account is now active and ready to use. You can log in and start organizing your tasks.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
              <a routerLink="/login" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Continue to Login
              </a>
              <a routerLink="/" style="background: #e2e8f0; color: #4a5568; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Go to Homepage
              </a>
            </div>
          </div>
        }

        <!-- Error State -->
        @if (errorMessage && !isLoading) {
          <div style="text-align: center; padding: 40px; background: #fed7d7; border: 2px solid #feb2b2; border-radius: 10px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #2d3748; margin-bottom: 15px;">Verification Failed</h2>
            <p style="color: #4a5568; margin-bottom: 25px; font-size: 1.1rem;">{{ errorMessage }}</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
              <a routerLink="/login" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; width: 200px; text-align: center;">
                Back to Login
              </a>
              <a routerLink="/register" style="background: #e2e8f0; color: #4a5568; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; width: 200px; text-align: center;">
                Create New Account
              </a>
              
              @if (showResendOption) {
                <button (click)="resendVerification()" [disabled]="resendLoading" 
                        style="background: transparent; color: #667eea; border: 2px solid #667eea; padding: 12px 24px; border-radius: 6px; font-weight: 600; width: 200px; cursor: pointer;">
                  @if (resendLoading) {
                    <span>Sending...</span>
                  } @else {
                    <span>Resend Verification Email</span>
                  }
                </button>
              }
            </div>

            @if (resendSuccess) {
              <div style="background: #c6f6d5; color: #276749; padding: 15px; border-radius: 6px; margin-top: 20px;">
                ✅ New verification email sent! Please check your inbox.
              </div>
            }
          </div>
        }

        <!-- Debug Info -->
        <div style="margin-top: 30px; padding: 15px; background: #f7fafc; border-radius: 6px; font-size: 0.9rem;">
          <h3 style="margin-bottom: 10px;">Debug Information:</h3>
          <p><strong>Email:</strong> {{ userEmail }}</p>
          <p><strong>Environment:</strong> {{ isProduction() ? 'Production' : 'Development' }}</p>
          <p><strong>API Base:</strong> {{ getApiUrl() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .verify-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .container {
        margin: 20px auto !important;
        padding: 10px !important;
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
  currentApiCall = '';
  userEmail: string | null = null;

  // Debug methods
  getApiUrl() {
    return environment.apiUrl;
  }

  isProduction() {
    return environment.production;
  }

  ngOnInit() {
    this.userEmail = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    console.log('🔍 Email verification started with params:', { email: this.userEmail, token });
    console.log('🔍 Environment:', environment);

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
    this.currentApiCall = verifyUrl;
    
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
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          this.isLoading = false;
          this.showResendOption = true;
          
          if (error.status === 400) {
            this.errorMessage = error.error?.message || "This verification link is invalid or has expired.";
          } else if (error.status === 404) {
            this.errorMessage = "User not found. Please check if you used the correct email address.";
          } else if (error.status === 0) {
            this.errorMessage = `Unable to connect to the server. (Trying to reach: ${environment.apiUrl})`;
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