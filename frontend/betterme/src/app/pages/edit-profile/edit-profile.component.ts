import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UpdateProfileRequest, User } from '../../services/auth';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="edit-profile-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="edit-profile-container">
          <!-- Header Navigation -->
          <div class="header-nav">
            <button class="back-btn" (click)="goBack()">
              <span class="back-icon">←</span>
              <span class="back-text">Back to Profile</span>
            </button>
          </div>

          <!-- Main Edit Card -->
          <div class="edit-profile-card glass-card">
            <div class="card-header">
              <h1 class="gradient-text">Edit Profile</h1>
              <p class="subtitle">Update your personal information and preferences</p>
            </div>

            <form [formGroup]="editProfileForm" (ngSubmit)="onSubmit()" class="profile-form">
              <!-- Display Name Field -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-text">Display Name</span>
                  <span class="required-indicator">*</span>
                </label>
                <div class="input-container">
                  <input
                    type="text"
                    formControlName="displayName"
                    class="form-input"
                    placeholder="Enter your display name"
                    [class.input-error]="displayName?.invalid && displayName?.touched"
                    [class.input-success]="displayName?.valid && displayName?.touched"
                  />
                  <div class="input-icon">👤</div>
                </div>
                <div class="validation-messages">
                  <div class="error-message" *ngIf="displayName?.invalid && displayName?.touched">
                    <span class="error-icon">⚠️</span>
                    <span *ngIf="displayName?.errors?.['required']">Display name is required</span>
                    <span *ngIf="displayName?.errors?.['minlength']">Minimum 2 characters required</span>
                  </div>
                  <div class="success-message" *ngIf="displayName?.valid && displayName?.touched">
                    <span class="success-icon">✅</span>
                    Looks good!
                  </div>
                </div>
              </div>

              <!-- Email Field -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-text">Email Address</span>
                  <span class="required-indicator">*</span>
                </label>
                <div class="input-container">
                  <input
                    type="email"
                    formControlName="email"
                    class="form-input"
                    placeholder="Enter your email address"
                    [class.input-error]="email?.invalid && email?.touched"
                    [class.input-success]="email?.valid && email?.touched"
                  />
                  <div class="input-icon">📧</div>
                </div>
                <div class="validation-messages">
                  <div class="error-message" *ngIf="email?.invalid && email?.touched">
                    <span class="error-icon">⚠️</span>
                    <span *ngIf="email?.errors?.['required']">Email is required</span>
                    <span *ngIf="email?.errors?.['email']">Please enter a valid email address</span>
                  </div>
                  <div class="success-message" *ngIf="email?.valid && email?.touched">
                    <span class="success-icon">✅</span>
                    Valid email format
                  </div>
                </div>
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
                  [disabled]="editProfileForm.invalid || isLoading"
                  [class.loading]="isLoading"
                >
                  <span class="btn-content">
                    <span class="btn-spinner" *ngIf="isLoading"></span>
                    {{ isLoading ? 'Updating Profile...' : 'Update Profile' }}
                  </span>
                </button>
              </div>

              <!-- Status Messages -->
              <div class="status-messages">
                <div class="error-card" *ngIf="errorMessage">
                  <div class="error-icon">❌</div>
                  <div class="error-content">
                    <h4>Update Failed</h4>
                    <p>{{ errorMessage }}</p>
                  </div>
                </div>

                <div class="success-card" *ngIf="successMessage">
                  <div class="success-icon">🎉</div>
                  <div class="success-content">
                    <h4>Profile Updated!</h4>
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
    .edit-profile-page {
      min-height: 100vh;
      background: var(--bg-gradient);
      position: relative;
      overflow-x: hidden;
      transition: background 0.3s ease;
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
      transition: background 0.3s ease;
    }

    body.dark-mode .shape {
      background: rgba(255, 255, 255, 0.05);
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
      background: transparent;
    }

    body.dark-mode .container {
      background: transparent;
    }

    .edit-profile-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem 1rem;
      background: transparent;
    }

    body.dark-mode .edit-profile-container {
      background: transparent;
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

    body.dark-mode .back-btn {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(-5px);
    }

    body.dark-mode .back-btn:hover {
      background: rgba(26, 26, 26, 0.5);
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
      transition: all 0.3s ease;
    }

    body.dark-mode .glass-card {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .card-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    body.dark-mode .card-header {
      background: transparent;
    }

    .gradient-text {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transition: background 0.3s ease;
    }

    body.dark-mode .gradient-text {
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.1rem;
    }

    body.dark-mode .subtitle {
      color: rgba(255, 255, 255, 0.8);
    }

    .profile-form {
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

    body.dark-mode .label-text {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .form-label {
      color: rgba(255, 255, 255, 0.9);
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

    body.dark-mode .form-input {
      background: rgba(26, 26, 26, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.1);
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

    body.dark-mode .form-input:focus {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
    }

    body.dark-mode .form-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .form-input.input-error {
      border-color: #f87171;
      background: rgba(248, 113, 113, 0.1);
    }

    body.dark-mode .form-input.input-error {
      border-color: #f87171;
      background: rgba(248, 113, 113, 0.15);
    }

    .form-input.input-success {
      border-color: #4ade80;
      background: rgba(74, 222, 128, 0.1);
    }

    body.dark-mode .form-input.input-success {
      border-color: #4ade80;
      background: rgba(74, 222, 128, 0.15);
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .input-icon {
      color: rgba(255, 255, 255, 0.6);
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

    body.dark-mode .error-message {
      color: rgba(254, 202, 202, 0.9);
    }

    .success-message {
      color: #bbf7d0;
    }

    body.dark-mode .success-message {
      color: rgba(187, 247, 208, 0.9);
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

    body.dark-mode .btn-gradient {
      background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
      box-shadow: 0 4px 15px rgba(5, 150, 105, 0.5);
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

    body.dark-mode .btn-outline {
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .btn-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    body.dark-mode .btn-gradient:hover:not(:disabled) {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      box-shadow: 0 8px 25px rgba(5, 150, 105, 0.7);
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

    body.dark-mode .error-card {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .success-card {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #bbf7d0;
    }

    body.dark-mode .success-card {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.4);
    }

    .error-icon, .success-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .error-content h4, .success-content h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      color: inherit;
    }

    body.dark-mode .error-content h4 {
      color: rgba(254, 202, 202, 0.95);
    }

    body.dark-mode .success-content h4 {
      color: rgba(187, 247, 208, 0.95);
    }

    .error-content p, .success-content p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.9;
      color: inherit;
    }

    body.dark-mode .error-content p {
      color: rgba(254, 202, 202, 0.85);
    }

    body.dark-mode .success-content p {
      color: rgba(187, 247, 208, 0.85);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .edit-profile-container {
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
      }

      .gradient-text {
        font-size: 2rem;
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
    }
  `]
})
export class EditProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  editProfileForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: User | null = null;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    this.editProfileForm = this.fb.group({
      displayName: [this.currentUser?.displayName || '', [Validators.required, Validators.minLength(2)]],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]]
    });
  }

  get displayName() { return this.editProfileForm.get('displayName'); }
  get email() { return this.editProfileForm.get('email'); }

  onSubmit(): void {
    if (this.editProfileForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: UpdateProfileRequest = this.editProfileForm.value;

    this.authService.updateProfile(updateData).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Your profile has been updated successfully!';
        setTimeout(() => this.router.navigate(['/profile']), 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}