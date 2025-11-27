import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="home-page">
      <!-- Animated Background -->
      <div class="background-animation">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
        <div class="floating-shape shape-4"></div>
      </div>

      <div class="container">
        <div class="hero-section">
          <div class="hero-content glass-card">
            <!-- Main Hero Content -->
            <div class="hero-main">
              <h1 class="hero-title gradient-text">
                {{ isLoggedIn ? 'Welcome Back!' : 'Welcome to BetterMe' }}
              </h1>
              <p class="hero-subtitle">
                {{ isLoggedIn ? 'Ready to continue organizing your tasks?' : 'Transform your productivity with beautiful task management' }}
              </p>
              
              <div class="hero-actions">
                <!-- Show Tasks/Dashboard when logged in -->
                @if (isLoggedIn) {
                  <a routerLink="/tasks" class="btn btn-gradient btn-large">
                    <span class="btn-icon">📝</span>
                    View My Tasks
                  </a>
                  <a routerLink="/profile" class="btn btn-outline btn-large">
                    <span class="btn-icon">👤</span>
                    My Profile
                  </a>
                  <button (click)="logout()" class="btn btn-outline btn-large">
                    <span class="btn-icon">🚪</span>
                    Log Out
                  </button>
                } 
                <!-- Show Login/Register when logged out -->
                @else {
                  <a routerLink="/register" class="btn btn-gradient btn-large">
                    <span class="btn-icon">🚀</span>
                    Start Your Journey
                  </a>
                  <a routerLink="/login" class="btn btn-outline btn-large">
                    <span class="btn-icon">🔑</span>
                    Sign In
                  </a>
                }
              </div>

              <!-- Welcome message for logged in users -->
              @if (isLoggedIn && currentUser) {
                <div class="welcome-message">
                  <p>Hello, <strong>{{ currentUser.displayName }}</strong>! 👋</p>
                  <p class="welcome-subtext">Great to see you back. Let's get things done!</p>
                </div>
              }
            </div>

            <!-- Features Grid -->
            <div class="features-grid">
              @for (feature of features; track feature.title) {
                <div class="feature-card">
                  <div class="feature-icon">{{ feature.icon }}</div>
                  <h3 class="feature-title">{{ feature.title }}</h3>
                  <p class="feature-description">{{ feature.description }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-page {
      min-height: 100vh;
      background: var(--bg-gradient);
      position: relative;
      overflow: hidden;
      transition: background 0.3s ease;
    }

    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .floating-shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;
      transition: background 0.3s ease;
    }

    body.dark-mode .floating-shape {
      background: rgba(255, 255, 255, 0.05);
    }

    .shape-1 {
      width: 120px;
      height: 120px;
      top: 10%;
      left: 8%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 80px;
      height: 80px;
      top: 65%;
      right: 12%;
      animation-delay: 2s;
    }

    .shape-3 {
      width: 60px;
      height: 60px;
      bottom: 30%;
      left: 18%;
      animation-delay: 4s;
    }

    .shape-4 {
      width: 90px;
      height: 90px;
      top: 30%;
      right: 25%;
      animation-delay: 1s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(180deg); }
    }

    .container {
      position: relative;
      z-index: 1;
    }

    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 1rem;
      padding-top: 4rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2.5rem 2rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      width: 100%;
      max-width: 1000px;
      margin-top: 2rem;
      transition: all 0.3s ease;
    }

    body.dark-mode .glass-card {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }

    .hero-main {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .gradient-text {
      font-size: 2.8rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.1;
      transition: background 0.3s ease;
    }

    body.dark-mode .gradient-text {
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 2rem;
      font-weight: 500;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }

    .btn-large {
      min-width: 160px;
    }

    .btn-gradient {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 6px 20px rgba(74, 222, 128, 0.4);
      transition: all 0.3s ease;
    }

    body.dark-mode .btn-gradient {
      background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
      box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    body.dark-mode .btn-outline {
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    body.dark-mode .btn:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
    }

    .btn-gradient:hover {
      box-shadow: 0 8px 25px rgba(74, 222, 128, 0.6);
    }

    body.dark-mode .btn-gradient:hover {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      box-shadow: 0 8px 25px rgba(5, 150, 105, 0.7);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    body.dark-mode .btn-outline:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    /* Welcome Message */
    .welcome-message {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    body.dark-mode .welcome-message {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .welcome-message p {
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      font-size: 1.1rem;
    }

    .welcome-message strong {
      color: white;
    }

    .welcome-subtext {
      color: rgba(255, 255, 255, 0.7) !important;
      font-size: 0.95rem !important;
      margin-top: 0.5rem !important;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    body.dark-mode .feature-card {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .feature-card:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    body.dark-mode .feature-card:hover {
      background: rgba(26, 26, 26, 0.6);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .feature-icon {
      font-size: 2.2rem;
      margin-bottom: 1rem;
      display: block;
    }

    .feature-title {
      color: white;
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .feature-description {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.5;
      font-size: 0.9rem;
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .hero-section {
        padding: 0.5rem;
        padding-top: 3rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
        border-radius: 20px;
        margin-top: 1rem;
      }

      .gradient-text {
        font-size: 2.2rem;
      }

      .hero-subtitle {
        font-size: 1.1rem;
      }

      .hero-actions {
        flex-direction: column;
        gap: 0.75rem;
      }

      .btn {
        width: 100%;
        max-width: 220px;
        justify-content: center;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .feature-card {
        padding: 1.25rem 1rem;
      }

      .welcome-message {
        padding: 1rem;
      }
    }

    @media (max-width: 480px) {
      .hero-section {
        padding-top: 2rem;
      }

      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 16px;
        margin-top: 0.5rem;
      }

      .gradient-text {
        font-size: 1.8rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .feature-card {
        padding: 1rem;
      }

      .feature-icon {
        font-size: 1.8rem;
      }

      .welcome-message {
        padding: 0.75rem;
      }

      .welcome-message p {
        font-size: 1rem;
      }
    }
  `]
})
export class HomeComponent {
  private authService = inject(AuthService);

  features = [
    {
      icon: '✅',
      title: 'Smart Task Management',
      description: 'Create, organize, and track your tasks with our beautiful interface'
    },
    {
      icon: '🚀',
      title: 'Boost Productivity',
      description: 'Achieve more with features designed to help you focus'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security'
    }
  ];

  // Authentication properties with proper typing
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
  }
}