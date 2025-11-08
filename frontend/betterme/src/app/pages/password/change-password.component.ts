import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ChangePasswordRequest } from '../../services/auth';

// Custom validator to confirm new passwords match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="change-password-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="change-password-container">
          <!-- Header Navigation -->
          <div class="header-nav">
            <button class="back-btn" (click)="goBack()">
              <span class="back-icon">←</span>
              <span class="back-text">Back to Profile</span>
            </button>
          </div>

          <!-- Main Password Card -->
          <div class="change-password-card glass-card">
            <div class="card-header">
              <div class="security-icon">🔒</div>
              <h1 class="gradient-text">Change Password</h1>
              <p class="subtitle">Secure your account with a new password</p>
            </div>

            <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()" class="password-form">
              <!-- Current Password -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-text">Current Password</span>
                  <span class="required-indicator">*</span>
                </label>
                <div class="input-container">
                  <input
                    type="password"
                    formControlName="currentPassword"
                    class="form-input"
                    placeholder="Enter your current password"
                    [class.input-error]="currentPassword?.invalid && currentPassword?.touched"
                    [class.input-success]="currentPassword?.valid && currentPassword?.touched"
                  />
                  <div class="input-icon">🔑</div>
                </div>
                <div class="validation-messages">
                  <div class="error-message" *ngIf="currentPassword?.invalid && currentPassword?.touched">
                    <span class="error-icon">⚠️</span>
                    Current password is required
                  </div>
                </div>
              </div>

              <!-- New Password -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-text">New Password</span>
                  <span class="required-indicator">*</span>
                </label>
                <div class="input-container">
                  <input
                    type="password"
                    formControlName="newPassword"
                    class="form-input"
                    placeholder="Enter your new password"
                    [class.input-error]="newPassword?.invalid && newPassword?.touched"
                    [class.input-success]="newPassword?.valid && newPassword?.touched"
                  />
                  <div class="input-icon">🆕</div>
                </div>
                <div class="validation-messages">
                  <div class="error-message" *ngIf="newPassword?.invalid && newPassword?.touched">
                    <span class="error-icon">⚠️</span>
                    <span *ngIf="newPassword?.errors?.['required']">New password is required</span>
                    <span *ngIf="newPassword?.errors?.['minlength']">Must be at least 6 characters</span>
                  </div>
                  <div class="success-message" *ngIf="newPassword?.valid && newPassword?.touched">
                    <span class="success-icon">✅</span>
                    Strong password!
                  </div>
                </div>
              </div>

              <!-- Confirm New Password -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-text">Confirm New Password</span>
                  <span class="required-indicator">*</span>
                </label>
                <div class="input-container">
                  <input
                    type="password"
                    formControlName="confirmPassword"
                    class="form-input"
                    placeholder="Confirm your new password"
                    [class.input-error]="(confirmPassword?.touched && changePasswordForm.errors?.['passwordMismatch']) || (confirmPassword?.invalid && confirmPassword?.touched)"
                    [class.input-success]="confirmPassword?.valid && confirmPassword?.touched && !changePasswordForm.errors?.['passwordMismatch']"
                  />
                  <div class="input-icon">✅</div>
                </div>
                <div class="validation-messages">
                  <div class="error-message" *ngIf="confirmPassword?.touched && changePasswordForm.errors?.['passwordMismatch']">
                    <span class="error-icon">⚠️</span>
                    Passwords do not match
                  </div>
                  <div class="error-message" *ngIf="confirmPassword?.invalid && confirmPassword?.touched && !changePasswordForm.errors?.['passwordMismatch']">
                    <span class="error-icon">⚠️</span>
                    Please confirm your new password
                  </div>
                  <div class="success-message" *ngIf="confirmPassword?.valid && confirmPassword?.touched && !changePasswordForm.errors?.['passwordMismatch']">
                    <span class="success-icon">✅</span>
                    Passwords match!
                  </div>
                </div>
              </div>

              <!-- Password Requirements -->
              <div class="requirements-card">
                <h4>Password Requirements</h4>
                <ul class="requirements-list">
                  <li [class.requirement-met]="newPassword?.value?.length >= 6">
                    <span class="requirement-icon">{{ newPassword?.value?.length >= 6 ? '✅' : '⚪' }}</span>
                    At least 6 characters long
                  </li>
                  <li [class.requirement-met]="!changePasswordForm.errors?.['passwordMismatch'] && confirmPassword?.valid">
                    <span class="requirement-icon">{{ !changePasswordForm.errors?.['passwordMismatch'] && confirmPassword?.valid ? '✅' : '⚪' }}</span>
                    Passwords must match
                  </li>
                </ul>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button 
                  type="button" 
                  class="btn btn-outline" 
                  (click)="goBack()"
                  [disabled]="isLoading"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="btn btn-gradient" 
                  [disabled]="changePasswordForm.invalid || isLoading"
                  [class.loading]="isLoading"
                >
                  <span class="btn-content">
                    <span class="btn-spinner" *ngIf="isLoading"></span>
                    {{ isLoading ? 'Updating Password...' : 'Change Password' }}
                  </span>
                </button>
              </div>

              <!-- Status Messages -->
              <div class="status-messages">
                <div class="error-card" *ngIf="errorMessage">
                  <div class="error-icon">❌</div>
                  <div class="error-content">
                    <h4>Password Change Failed</h4>
                    <p>{{ errorMessage }}</p>
                  </div>
                </div>

                <div class="success-card" *ngIf="successMessage">
                  <div class="success-icon">🎉</div>
                  <div class="success-content">
                    <h4>Password Updated!</h4>
                    <p>{{ successMessage }}</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .change-password-page {
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

    .change-password-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header-nav {
      margin-bottom: 2rem;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0.75rem 1.5rem;
      color: white;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(-5px);
    }

    .back-icon {
      font-size: 1.2rem;
    }

    .back-text {
      font-weight: 600;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .security-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
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
    }

    .password-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: white;
      font-weight: 600;
      font-size: 1rem;
    }

    .label-text {
      color: white;
    }

    .required-indicator {
      color: #f87171;
    }

    .input-container {
      position: relative;
    }

    .form-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .form-input:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }

    .form-input.input-error {
      border-color: #f87171;
      background: rgba(248, 113, 113, 0.1);
    }

    .form-input.input-success {
      border-color: #4ade80;
      background: rgba(74, 222, 128, 0.1);
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .validation-messages {
      min-height: 1.5rem;
    }

    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .error-message {
      color: #fecaca;
    }

    .success-message {
      color: #bbf7d0;
    }

    .requirements-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1rem;
    }

    .requirements-card h4 {
      color: white;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .requirements-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .requirements-list li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
    }

    .requirements-list li.requirement-met {
      color: #bbf7d0;
    }

    .requirement-icon {
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
      flex: 1;
    }

    .btn-gradient {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
      position: relative;
      overflow: hidden;
    }

    .btn-gradient:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-gradient.loading {
      pointer-events: none;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .btn-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .status-messages {
      margin-top: 1rem;
    }

    .error-card, .success-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .error-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    .success-card {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #bbf7d0;
    }

    .error-icon, .success-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .error-content h4, .success-content h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
    }

    .error-content p, .success-content p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .change-password-container {
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
      }

      .gradient-text {
        font-size: 2rem;
      }

      .security-icon {
        font-size: 3rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }

      .back-btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 20px;
      }

      .gradient-text {
        font-size: 1.75rem;
      }

      .form-input {
        padding: 0.875rem 0.875rem 0.875rem 2.5rem;
      }

      .input-icon {
        left: 0.875rem;
      }

      .requirements-card {
        padding: 1rem;
      }
    }
  `]
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  changePasswordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword()     { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const passwordData: ChangePasswordRequest = {
      currentPassword: this.changePasswordForm.value.currentPassword,
      newPassword: this.changePasswordForm.value.newPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Your password has been updated successfully!';
        this.changePasswordForm.reset();

        setTimeout(() => this.router.navigate(['/profile']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to change password. Please check your current password and try again.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}