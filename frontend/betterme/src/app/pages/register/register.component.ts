import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="register-container">
          <!-- Main Register Card -->
          <div class="register-card glass-card">
            <!-- Header Section -->
            <div class="auth-header">
              <h1 class="gradient-text">Create Account</h1>
              <p class="subtitle">Start your productivity journey with us</p>
            </div>

            <!-- Register Form -->
            <form (ngSubmit)="onRegister()" class="auth-form">
              <!-- Display Name Field -->
              <div class="form-group">
                <label class="form-label">Display Name</label>
                <input 
                  type="text"
                  class="form-control"
                  placeholder="Enter your full name"
                  [(ngModel)]="displayName"
                  name="displayName"
                  required
                  [class.error]="displayNameError"
                />
                @if (displayNameError) {
                  <div class="field-error">{{ displayNameError }}</div>
                }
              </div>

              <!-- Email Field -->
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input 
                  type="email"
                  class="form-control"
                  placeholder="your.email@example.com"
                  [(ngModel)]="email"
                  name="email"
                  required
                  [class.error]="emailError"
                />
                @if (emailError) {
                  <div class="field-error">{{ emailError }}</div>
                }
              </div>

              <!-- Password Field -->
              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="password-input-container">
                  <input 
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control password-input"
                    [class.error]="passwordErrors.length > 0 && password.length > 0"
                    placeholder="Choose a strong password"
                    [(ngModel)]="password"
                    name="password"
                    required
                    (input)="validatePassword()"
                  />
                  <button 
                    type="button" 
                    class="password-toggle"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <span class="password-toggle-icon">
                      {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                    </span>
                  </button>
                </div>

                <!-- Password Instructions -->
                @if (password.length > 0) {
                  <div class="password-instructions">
                    <h4>Password Requirements:</h4>
                    <div class="instruction-list">
                      <div class="instruction" [class.completed]="hasMinLength">
                        <span class="instruction-icon">{{ hasMinLength ? '✅' : '🔒' }}</span>
                        <span class="instruction-text">At least 6 characters</span>
                      </div>
                      <div class="instruction" [class.completed]="hasLetters">
                        <span class="instruction-icon">{{ hasLetters ? '✅' : '🔤' }}</span>
                        <span class="instruction-text">Contains letters (A-Z)</span>
                      </div>
                      <div class="instruction" [class.completed]="hasNumbers">
                        <span class="instruction-icon">{{ hasNumbers ? '✅' : '🔢' }}</span>
                        <span class="instruction-text">Contains numbers (0-9)</span>
                      </div>
                      <div class="instruction" [class.completed]="hasSymbols">
                        <span class="instruction-icon">{{ hasSymbols ? '✅' : '⚡' }}</span>
                        <span class="instruction-text">Contains symbols (!@#$% etc.)</span>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="password-hint">
                    🔒 Use 6+ characters with mix of letters, numbers & symbols
                  </div>
                }

                <!-- Password Strength Meter -->
                @if (password) {
                  <div class="password-strength">
                    <div class="strength-meter">
                      <div class="strength-bar" [class]="getStrengthClass()"></div>
                    </div>
                    <div class="strength-label">{{ getStrengthLabel() }}</div>
                  </div>
                }
              </div>

              <!-- Confirm Password Field -->
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <div class="password-input-container">
                  <input 
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control password-input"
                    [class.error]="confirmPasswordError"
                    placeholder="Re-enter your password"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    required
                    (input)="validatePasswordMatch()"
                  />
                  <button 
                    type="button" 
                    class="password-toggle"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <span class="password-toggle-icon">
                      {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                    </span>
                  </button>
                </div>
                @if (confirmPasswordError) {
                  <div class="field-error">{{ confirmPasswordError }}</div>
                }
              </div>

              <!-- Error Message -->
              @if (errorMessage) {
                <div class="error-card">
                  <div class="error-icon">⚠️</div>
                  <div class="error-content">
                    <h3>Registration Failed</h3>
                    <p>{{ errorMessage }}</p>
                  </div>
                </div>
              }

              <!-- Submit Button -->
              <button 
                class="btn btn-primary btn-full" 
                type="submit" 
                [disabled]="isLoading || !isFormValid()"
              >
                @if (isLoading) {
                  <div class="button-loading">
                    <div class="button-spinner"></div>
                    Creating your account...
                  </div>
                } @else {
                  <span class="btn-icon">🚀</span>
                  Create Account & Start Organizing
                }
              </button>
            </form>

            <!-- Divider -->
            <div class="divider">
              <span>Already have an account?</span>
            </div>

            <!-- Login Link -->
            <a routerLink="/login" class="btn btn-secondary btn-full">
              <span class="btn-icon">↩️</span>
              Sign In to Existing Account
            </a>

            <!-- Terms Notice -->
            <div class="terms-notice">
              By creating an account, you agree to our 
              <a href="/terms" class="text-link">Terms of Service</a> 
              and 
              <a href="/privacy" class="text-link">Privacy Policy</a>
            </div>
          </div>

          <!-- Features Card -->
          <div class="features-card glass-card">
            <h3 class="features-title">Ready to Get Organized? 🎯</h3>
            <div class="features-list">
              <div class="feature-item">
                <span class="feature-icon">📝</span>
                <div class="feature-content">
                  <div class="feature-title">Create Tasks Instantly</div>
                  <div class="feature-description">Start organizing your to-dos right after registration</div>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⏰</span>
                <div class="feature-content">
                  <div class="feature-title">Set Due Dates</div>
                  <div class="feature-description">Never miss deadlines with smart reminders</div>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🏷️</span>
                <div class="feature-content">
                  <div class="feature-title">Organize with Tags</div>
                  <div class="feature-description">Categorize tasks for better organization</div>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <div class="feature-content">
                  <div class="feature-title">Track Progress</div>
                  <div class="feature-description">See your productivity improve over time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Password Instructions */
    .password-instructions {
      margin: 15px 0;
      padding: 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .password-instructions h4 {
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 12px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .instruction-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .instruction {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .instruction.completed {
      color: rgba(255, 255, 255, 0.9);
    }

    .instruction-icon {
      font-size: 1rem;
      width: 20px;
      text-align: center;
    }

    .instruction-text {
      flex: 1;
    }

    /* Enhanced Password Hint */
    .password-hint {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* Password Strength Meter */
    .password-strength {
      margin: 15px 0 10px 0;
    }

    .strength-meter {
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .strength-bar {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 4px;
    }

    .strength-bar.weak {
      background: #ef4444;
      width: 25%;
    }

    .strength-bar.fair {
      background: #f59e0b;
      width: 50%;
    }

    .strength-bar.good {
      background: #3b82f6;
      width: 75%;
    }

    .strength-bar.strong {
      background: #10b981;
      width: 100%;
    }

    .strength-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      text-align: right;
      font-weight: 600;
    }

    /* Field Errors */
    .field-error {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 5px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .form-control.error {
      border-color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.1) !important;
    }

    /* Enhanced Button */
    .btn-primary:not(:disabled) {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }

    .register-page {
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

    .register-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: center;
      min-height: 100vh;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
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
      font-weight: 500;
    }

    .auth-form {
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
    }

    .form-control {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-size: 16px;
      color: white;
      transition: all 0.3s ease;
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .form-control:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }

    /* Password Input Container */
    .password-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input {
      padding-right: 50px; /* Space for the eye button */
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .password-toggle:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .password-toggle:active {
      transform: scale(0.95);
    }

    .password-toggle-icon {
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .password-hint {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 0.5rem;
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
      justify-content: center;
    }

    .btn-full {
      width: 100%;
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .button-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .button-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Error State */
    .error-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .error-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .error-content h3 {
      color: white;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .error-content p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      margin: 0;
    }

    /* Success Card */
    .success-card {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .success-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .success-content h3 {
      color: white;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .success-content p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
    }

    .success-note {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      font-style: italic;
    }

    /* Divider */
    .divider {
      text-align: center;
      margin: 1.5rem 0;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
    }

    .divider span {
      background: rgba(255, 255, 255, 0.1);
      padding: 0 1rem;
      position: relative;
    }

    /* Terms Notice */
    .terms-notice {
      text-align: center;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .text-link {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: underline;
      font-weight: 500;
    }

    /* Features Card */
    .features-card {
      height: fit-content;
    }

    .features-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .feature-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .feature-title {
      color: white;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .feature-description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .register-container {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
      }

      .gradient-text {
        font-size: 2rem;
      }

      .features-card {
        order: -1;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 20px;
      }

      .gradient-text {
        font-size: 1.8rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .btn {
        padding: 0.875rem 1.5rem;
      }

      .password-toggle {
        right: 8px;
        padding: 6px;
      }
    }
  `]
})
export class RegisterComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  // Password validation states
  passwordErrors: string[] = [];
  hasMinLength = false;
  hasLetters = false;
  hasNumbers = false;
  hasSymbols = false;

  // Field errors
  displayNameError = '';
  emailError = '';
  confirmPasswordError = '';

  validatePasswordMatch(): void {
    this.confirmPasswordError = '';
    
    if (this.confirmPassword && this.password !== this.confirmPassword) {
      this.confirmPasswordError = '⚠️ Passwords do not match';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validatePassword(): void {
    this.passwordErrors = [];
    
    // Check minimum length
    this.hasMinLength = this.password.length >= 6;
    if (!this.hasMinLength) {
      this.passwordErrors.push('Password must be at least 6 characters long');
    }

    // Check for letters
    this.hasLetters = /[a-zA-Z]/.test(this.password);
    if (!this.hasLetters) {
      this.passwordErrors.push('Password must contain letters');
    }

    // Check for numbers
    this.hasNumbers = /[0-9]/.test(this.password);
    if (!this.hasNumbers) {
      this.passwordErrors.push('Password must contain numbers');
    }

    // Check for symbols
    this.hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.password);
    if (!this.hasSymbols) {
      this.passwordErrors.push('Password must contain symbols');
    }

    // Also validate password match when password changes
    this.validatePasswordMatch();
  }

  getStrengthClass(): string {
    const requirementsMet = [
      this.hasMinLength,
      this.hasLetters,
      this.hasNumbers,
      this.hasSymbols
    ].filter(Boolean).length;

    if (requirementsMet === 4) return 'strong';
    if (requirementsMet === 3) return 'good';
    if (requirementsMet === 2) return 'fair';
    return 'weak';
  }

  getStrengthLabel(): string {
    const strengthClass = this.getStrengthClass();
    switch (strengthClass) {
      case 'strong': return 'Strong password ✅';
      case 'good': return 'Good password 👍';
      case 'fair': return 'Fair password ⚠️';
      case 'weak': return 'Weak password ❌';
      default: return '';
    }
  }

  validateForm(): boolean {
    let isValid = true;

    // Validate display name
    this.displayNameError = '';
    if (!this.displayName.trim()) {
      this.displayNameError = 'Display name is required';
      isValid = false;
    } else if (this.displayName.trim().length < 2) {
      this.displayNameError = 'Display name must be at least 2 characters';
      isValid = false;
    }

    // Validate email
    this.emailError = '';
    if (!this.email.trim()) {
      this.emailError = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    this.validatePassword();
    if (this.passwordErrors.length > 0) {
      isValid = false;
    }

    // Validate password match
    this.validatePasswordMatch();
    if (this.confirmPasswordError) {
      isValid = false;
    }

    return isValid;
  }

  isFormValid(): boolean {
    return this.displayName.trim().length >= 2 &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) &&
           this.hasMinLength && this.hasLetters && this.hasNumbers && this.hasSymbols &&
           this.password === this.confirmPassword;
  }

  onRegister(): void {
    if (!this.validateForm()) {
      this.errorMessage = 'Please fix the errors above before submitting.';
      return;
    }

    // Explicit password match check
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match. Please check and try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      displayName: this.displayName,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Auto-login after successful registration
        this.authService.login({
          email: this.email,
          password: this.password
        }).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (loginResponse) => {
            // Redirect to tasks page automatically
            this.router.navigate(['/tasks']);
          },
          error: (loginError) => {
            // If auto-login fails, still redirect to login page
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}