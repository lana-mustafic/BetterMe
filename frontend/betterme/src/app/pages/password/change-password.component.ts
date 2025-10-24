import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ChangePasswordRequest } from '../../services/auth';

// Custom validator to check if passwords match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="change-password-container">
        <div class="header-actions">
          <button class="btn btn-back" (click)="goBack()">← Back to Profile</button>
        </div>

        <div class="change-password-card">
          <h1>Change Password</h1>
          <p>Update your account password</p>

          <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()" class="password-form">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                formControlName="currentPassword"
                class="form-control"
                [class.error]="currentPassword?.invalid && currentPassword?.touched"
                placeholder="Enter your current password"
              />
              @if (currentPassword?.invalid && currentPassword?.touched) {
                <div class="error-message">
                  Current password is required
                </div>
              }
            </div>

            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                formControlName="newPassword"
                class="form-control"
                [class.error]="newPassword?.invalid && newPassword?.touched"
                placeholder="Enter your new password"
              />
              @if (newPassword?.invalid && newPassword?.touched) {
                <div class="error-message">
                  @if (newPassword?.errors?.['required']) {
                    New password is required
                  }
                  @if (newPassword?.errors?.['minlength']) {
                    Password must be at least 6 characters
                  }
                </div>
              }
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                class="form-control"
                [class.error]="(confirmPassword?.invalid || changePasswordForm.errors?.['passwordMismatch']) && confirmPassword?.touched"
                placeholder="Confirm your new password"
              />
              @if (confirmPassword?.invalid && confirmPassword?.touched) {
                <div class="error-message">
                  Please confirm your new password
                </div>
              }
              @if (changePasswordForm.errors?.['passwordMismatch'] && confirmPassword?.touched) {
                <div class="error-message">
                  Passwords do not match
                </div>
              }
            </div>

            <div class="password-requirements">
              <p class="requirements-title">Password requirements:</p>
              <ul>
                <li [class.valid]="newPassword?.value?.length >= 6">At least 6 characters long</li>
                <li [class.valid]="newPassword?.value && confirmPassword?.value && newPassword?.value === confirmPassword?.value">Passwords match</li>
              </ul>
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="goBack()"
                [disabled]="isLoading"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="changePasswordForm.invalid || isLoading"
              >
                @if (isLoading) {
                  <span class="loading-text">Updating...</span>
                } @else {
                  Change Password
                }
              </button>
            </div>

            @if (errorMessage) {
              <div class="error-message global-error">
                {{ errorMessage }}
              </div>
            }

            @if (successMessage) {
              <div class="success-message">
                {{ successMessage }}
              </div>
            }
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .change-password-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header-actions {
      margin-bottom: 1rem;
    }

    .btn-back {
      background: #6c757d;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .change-password-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .change-password-card h1 {
      color: #333;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .change-password-card p {
      color: #666;
      margin-bottom: 2rem;
    }

    .password-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    label {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .form-control {
      padding: 12px 16px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 16px;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control.error {
      border-color: #e74c3c;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .global-error {
      text-align: center;
      padding: 1rem;
      background: #fee;
      border-radius: 8px;
      border: 1px solid #fcc;
    }

    .success-message {
      color: #27ae60;
      text-align: center;
      padding: 1rem;
      background: #efffed;
      border-radius: 8px;
      border: 1px solid #d1edff;
    }

    .password-requirements {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .requirements-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
      font-size: 0.9rem;
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 1.2rem;
      color: #666;
    }

    .password-requirements li {
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .password-requirements li.valid {
      color: #27ae60;
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      flex: 1;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .loading-text {
      opacity: 0.7;
    }

    @media (max-width: 768px) {
      .change-password-container {
        padding: 1rem 0.5rem;
      }

      .change-password-card {
        padding: 1.5rem;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  changePasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const passwordData: ChangePasswordRequest = {
      currentPassword: this.changePasswordForm.value.currentPassword,
      newPassword: this.changePasswordForm.value.newPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Password changed successfully!';
        this.changePasswordForm.reset();
        
        // Auto-navigate back after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to change password. Please try again.';
        console.error('Error changing password:', error);
      }
    });
  }

  private markAllAsTouched(): void {
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      this.changePasswordForm.get(key)?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}