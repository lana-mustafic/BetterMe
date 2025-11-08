import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="verify-container">

      <div class="verify-card">
        <h2 class="title">🌸 Verifying Your Email...</h2>

        <p *ngIf="isLoading" class="message soft">
          Please wait a moment while we confirm your account 💗
        </p>

        <div *ngIf="success && !isLoading" class="success">
          <h3>✨ Email Verified!</h3>
          <p>Your account is now active. You can sign in anytime 💞</p>
          <a routerLink="/login" class="btn">Go to Login</a>
        </div>

        <div *ngIf="errorMessage && !isLoading" class="error">
          <h3>💔 Verification Link Invalid</h3>
          <p>{{ errorMessage }}</p>
          <a routerLink="/login" class="btn">Back to Login</a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .verify-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      background: #faf7ff;
      padding: 2rem;
    }
    .verify-card {
      background: white;
      padding: 2.5rem;
      border-radius: 20px;
      width: 100%;
      max-width: 450px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(150, 120, 200, 0.12);
    }
    .title {
      font-size: 1.8rem;
      margin-bottom: 1rem;
      font-weight: 600;
      color: #6d4fa2;
    }
    .message.soft {
      color: #8a76a6;
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
    }
    .success h3,
    .error h3 {
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
      color: #6d4fa2;
    }
    .success p,
    .error p {
      color: #7e6c9f;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      background: #6d4fa2;
      color: white;
      padding: 0.7rem 1.4rem;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
      transition: 0.3s;
    }
    .btn:hover {
      background: #593e87;
    }
  `]
})
export class VerifyEmailComponent implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = true;
  success = false;
  errorMessage: string | null = null;

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!email || !token) {
      this.isLoading = false;
      this.errorMessage = "Verification link is missing information.";
      return;
    }

    this.http.get(`${environment.apiUrl}/auth/verify?email=${email}&token=${token}`)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.success = true;
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = "This link may be expired. Please request a new one.";
        }
      });
  }
}
