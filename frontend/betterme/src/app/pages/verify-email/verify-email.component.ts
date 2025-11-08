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
          <!-- Main Verification Card -->
          <div class="verify-card glass-card">
            <!-- Loading State -->
            @if (isLoading) {
              <div class="loading-section">
                <div class="loading-spinner">
                  <div class="spinner-ring"></div>
                </div>
                <h2 class="gradient-text">Verifying Your Email</h2>
                <p class="subtitle">Please wait while we confirm your account</p>
              </div>
            }

            <!-- Success State -->
            @if (success && !isLoading) {
              <div class="success-state">
                <div class="success-icon">✨</div>
                <h2 class="gradient-text">Email Verified!</h2>
                <p class="success-message">Your account is now active and ready to use. Welcome to our community!</p>
                <div class="success-actions">
                  <a routerLink="/login" class="btn btn-primary">
                    <span class="btn-icon">🚀</span>
                    Continue to Login
                  </a>
                </div>
              </div>
            }

            <!-- Error State -->
            @if (errorMessage && !isLoading) {
              <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2 class="error-title">Verification Failed</h2>
                <p class="error-message">{{ errorMessage }}</p>
                <div class="error-actions">
                  <a routerLink="/login" class="btn btn-primary">
                    <span class="btn-icon">↩️</span>
                    Back to Login
                  </a>
                  <a routerLink="/signup" class="btn btn-secondary">
                    <span class="btn-icon">📝</span>
                    Create New Account
                  </a>
                </div>
              </div>
            }
          </div>

          <!-- Additional Info Card -->
          @if (!isLoading) {
            <div class="info-card glass-card">
              <h3 class="info-title">Need Help?</h3>
              <p class="info-text">
                If you're experiencing issues with email verification, please check your spam folder or contact our support team.
              </p>
              <div class="info-links">
                <a href="/help" class="info-link">📧 Support Center</a>
                <a href="/contact" class="info-link">💬 Contact Us</a>
              </div>
            </div>
          }
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

    .verify-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .info-card {
      padding: 2rem;
    }

    .gradient-text {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 1rem;
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

    /* Loading State */
    .loading-section {
      padding: 2rem 0;
    }

    .loading-spinner {
      margin-bottom: 2rem;
    }

    .spinner-ring {
      width: 80px;
      height: 80px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    /* Success State */
    .success-state {
      padding: 1rem 0;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      animation: bounce 2s infinite;
    }

    .success-message {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .success-actions {
      display: flex;
      justify-content: center;
    }

    /* Error State */
    .error-state {
      padding: 1rem 0;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }

    .error-title {
      color: white;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .error-message {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }

    .error-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
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
      min-width: 200px;
      justify-content: center;
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

    /* Info Card */
    .info-title {
      color: white;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .info-text {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .info-links {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .info-link {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .info-link:hover {
      color: white;
    }

    /* Animations */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .verify-container {
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
      }

      .gradient-text {
        font-size: 1.8rem;
      }

      .error-title {
        font-size: 1.6rem;
      }

      .success-icon,
      .error-icon {
        font-size: 3rem;
      }

      .btn {
        width: 100%;
        min-width: auto;
      }

      .error-actions {
        width: 100%;
      }

      .info-links {
        flex-direction: column;
        gap: 1rem;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 20px;
      }

      .gradient-text {
        font-size: 1.6rem;
      }

      .subtitle {
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

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!email || !token) {
      this.isLoading = false;
      this.errorMessage = "Verification link is missing required information. Please check your email and try again.";
      return;
    }

    this.http.get(`${environment.apiUrl}/auth/verify?email=${email}&token=${token}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.success = true;
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 410) {
            this.errorMessage = "This verification link has expired. Please request a new verification email.";
          } else if (error.status === 409) {
            this.errorMessage = "This email has already been verified. You can proceed to login.";
          } else {
            this.errorMessage = "This verification link is invalid or has expired. Please request a new one.";
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}