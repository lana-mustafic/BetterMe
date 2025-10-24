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
    <div class="container">
      <div class="edit-profile-container">
        <div class="header-actions">
          <button class="btn btn-back" (click)="goBack()">← Back to Profile</button>
        </div>

        <div class="edit-profile-card">
          <h1>Edit Profile</h1>
          <p>Update your account information</p>

          <form [formGroup]="editProfileForm" (ngSubmit)="onSubmit()" class="profile-form">
            <div class="form-group">
              <label for="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                formControlName="displayName"
                class="form-control"
                [class.error]="displayName?.invalid && displayName?.touched"
                placeholder="Enter your display name"
              />
              @if (displayName?.invalid && displayName?.touched) {
                <div class="error-message">
                  @if (displayName?.errors?.['required']) {
                    Display name is required
                  }
                  @if (displayName?.errors?.['minlength']) {
                    Display name must be at least 2 characters
                  }
                </div>
              }
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-control"
                [class.error]="email?.invalid && email?.touched"
                placeholder="Enter your email address"
              />
              @if (email?.invalid && email?.touched) {
                <div class="error-message">
                  @if (email?.errors?.['required']) {
                    Email is required
                  }
                  @if (email?.errors?.['email']) {
                    Please enter a valid email address
                  }
                </div>
              }
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
                [disabled]="editProfileForm.invalid || isLoading"
              >
                @if (isLoading) {
                  <span class="loading-text">Updating...</span>
                } @else {
                  Update Profile
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
    .edit-profile-container {
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

    .edit-profile-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .edit-profile-card h1 {
      color: #333;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .edit-profile-card p {
      color: #666;
      margin-bottom: 2rem;
    }

    .profile-form {
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
      .edit-profile-container {
        padding: 1rem 0.5rem;
      }

      .edit-profile-card {
        padding: 1.5rem;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class EditProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  editProfileForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: User | null = null;

  constructor() {
    this.editProfileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.editProfileForm.patchValue({
        displayName: this.currentUser.displayName,
        email: this.currentUser.email
      });
    }
  }

  get displayName() { return this.editProfileForm.get('displayName'); }
  get email() { return this.editProfileForm.get('email'); }

  onSubmit(): void {
    if (this.editProfileForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: UpdateProfileRequest = this.editProfileForm.value;

    this.authService.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully!';
        
        // Auto-navigate back after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
        console.error('Error updating profile:', error);
      }
    });
  }

  private markAllAsTouched(): void {
    Object.keys(this.editProfileForm.controls).forEach(key => {
      this.editProfileForm.get(key)?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}