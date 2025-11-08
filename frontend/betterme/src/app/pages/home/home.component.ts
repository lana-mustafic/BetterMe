import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

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
              <h1 class="hero-title gradient-text">Welcome to BetterMe</h1>
              <p class="hero-subtitle">Transform your productivity with beautiful task management</p>
              
              <div class="hero-actions">
                <a routerLink="/register" class="btn btn-gradient btn-large">
                  <span class="btn-icon">🚀</span>
                  Start Your Journey
                </a>
                <a routerLink="/login" class="btn btn-outline btn-large">
                  <span class="btn-icon">🔑</span>
                  Sign In
                </a>
              </div>
            </div>

            <!-- Features Grid -->
            <div class="features-grid">
              <div class="feature-card" *ngFor="let feature of features">
                <div class="feature-icon">{{ feature.icon }}</div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </div>
            </div>

            <!-- Stats Section -->
            <div class="stats-section">
              <div class="stat-item">
                <div class="stat-number">10K+</div>
                <div class="stat-label">Tasks Completed</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">95%</div>
                <div class="stat-label">User Satisfaction</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">24/7</div>
                <div class="stat-label">Always Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
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
    }

    .shape-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 5%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 10%;
      animation-delay: 2s;
    }

    .shape-3 {
      width: 100px;
      height: 100px;
      bottom: 20%;
      left: 15%;
      animation-delay: 4s;
    }

    .shape-4 {
      width: 120px;
      height: 120px;
      top: 30%;
      right: 20%;
      animation-delay: 1s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .container {
      position: relative;
      z-index: 1;
    }

    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 32px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 4rem 3rem;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
      width: 100%;
      max-width: 1200px;
    }

    .hero-main {
      text-align: center;
      margin-bottom: 4rem;
    }

    .gradient-text {
      font-size: 4rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.1;
    }

    .hero-subtitle {
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 3rem;
      font-weight: 500;
    }

    .hero-actions {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 1.25rem 2.5rem;
      border: none;
      border-radius: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.1rem;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .btn-large {
      min-width: 200px;
    }

    .btn-gradient {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 8px 25px rgba(74, 222, 128, 0.4);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    }

    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
    }

    .btn-gradient:hover {
      box-shadow: 0 12px 35px rgba(74, 222, 128, 0.6);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      text-align: center;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .feature-card:hover {
      transform: translateY(-8px);
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
      display: block;
    }

    .feature-title {
      color: white;
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .feature-description {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      font-size: 1rem;
    }

    .stats-section {
      display: flex;
      justify-content: center;
      gap: 4rem;
      padding-top: 3rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      color: white;
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1rem;
      font-weight: 600;
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .hero-section {
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 3rem 2rem;
        border-radius: 24px;
      }

      .gradient-text {
        font-size: 2.5rem;
      }

      .hero-subtitle {
        font-size: 1.2rem;
      }

      .hero-actions {
        flex-direction: column;
        gap: 1rem;
      }

      .btn {
        width: 100%;
        max-width: 280px;
        justify-content: center;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .stats-section {
        flex-direction: column;
        gap: 2rem;
      }

      .feature-card {
        padding: 2rem 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 2rem 1.5rem;
        border-radius: 20px;
      }

      .gradient-text {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1.1rem;
      }

      .feature-card {
        padding: 1.5rem 1rem;
      }

      .feature-icon {
        font-size: 2.5rem;
      }

      .stat-number {
        font-size: 2rem;
      }
    }

    /* Extra large screens */
    @media (min-width: 1400px) {
      .gradient-text {
        font-size: 5rem;
      }

      .hero-subtitle {
        font-size: 1.75rem;
      }
    }
  `]
})
export class HomeComponent {
  features = [
    {
      icon: '✅',
      title: 'Smart Task Management',
      description: 'Create, organize, and track your tasks with our beautiful and intuitive interface'
    },
    {
      icon: '🚀',
      title: 'Boost Productivity',
      description: 'Achieve more with powerful features designed to help you focus and succeed'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy controls'
    }
  ];
}