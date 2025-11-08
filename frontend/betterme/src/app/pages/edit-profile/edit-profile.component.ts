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
              <label>Display Name</label>
              <input
                type="text"
                formControlName="displayName"
                class="form-control"
                [class.error]="displayName?.invalid && displayName?.touched"
              />
              <div class="error-message" *ngIf="displayName?.invalid && displayName?.touched">
                <div *ngIf="displayName?.errors?.['required']">Display name is required</div>
                <div *ngIf="displayName?.errors?.['minlength']">Minimum 2 characters required</div>
              </div>
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input
                type="email"
                formControlName="email"
                class="form-control"
                [class.error]="email?.invalid && email?.touched"
              />
              <div class="error-message" *ngIf="email?.invalid && email?.touched">
                <div *ngIf="email?.errors?.['required']">Email is required</div>
                <div *ngIf="email?.errors?.['email']">Enter a valid email</div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="editProfileForm.invalid || isLoading">
                {{ isLoading ? 'Updating...' : 'Update Profile' }}
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
    /* Keep your original CSS — no changes necessary */
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
        this.successMessage = '✅ Profile updated successfully!';
        setTimeout(() => this.router.navigate(['/profile']), 1200);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to update profile.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
