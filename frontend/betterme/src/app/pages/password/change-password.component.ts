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
    <div class="container">
      <div class="change-password-container">

        <button class="btn btn-back" (click)="goBack()">← Back to Profile</button>

        <div class="change-password-card">
          <h1>Change Password</h1>
          <p>Update your account password</p>

          <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()" class="password-form">

            <div class="form-group">
              <label>Current Password</label>
              <input
                type="password"
                class="form-control"
                formControlName="currentPassword"
              />
              <div class="error-message" *ngIf="currentPassword?.invalid && currentPassword?.touched">
                Current password is required
              </div>
            </div>

            <div class="form-group">
              <label>New Password</label>
              <input
                type="password"
                class="form-control"
                formControlName="newPassword"
              />
              <div class="error-message" *ngIf="newPassword?.invalid && newPassword?.touched">
                <div *ngIf="newPassword?.errors?.['required']">New password is required</div>
                <div *ngIf="newPassword?.errors?.['minlength']">Must be at least 6 characters</div>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                class="form-control"
                formControlName="confirmPassword"
              />
              <div class="error-message" *ngIf="confirmPassword?.touched && changePasswordForm.errors?.['passwordMismatch']">
                Passwords do not match
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="changePasswordForm.invalid || isLoading">
                {{ isLoading ? 'Updating...' : 'Change Password' }}
              </button>
            </div>

            <div class="error-message global-error" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <div class="success-message" *ngIf="successMessage">
              {{ successMessage }}
            </div>

          </form>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Keep your existing CSS — no changes needed */
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
        this.successMessage = res.message || '✅ Password changed successfully!';
        this.changePasswordForm.reset();

        setTimeout(() => this.router.navigate(['/profile']), 1200);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to change password.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
