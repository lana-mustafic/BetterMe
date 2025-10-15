import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to TodoApp</h1>
          <p class="hero-subtitle">The simplest way to organize your life and work</p>
          
          <div class="hero-features">
            <div class="feature">
              <span class="feature-icon">✅</span>
              <h3>Easy Task Management</h3>
              <p>Create, edit, and organize your tasks effortlessly</p>
            </div>
            <div class="feature">
              <span class="feature-icon">🚀</span>
              <h3>Boost Productivity</h3>
              <p>Stay focused and get more done with our intuitive interface</p>
            </div>
            <div class="feature">
              <span class="feature-icon">🔒</span>
              <h3>Secure & Private</h3>
              <p>Your data is safe with our secure authentication system</p>
            </div>
          </div>
          
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary btn-large">Get Started</a>
            <a routerLink="/login" class="btn" style="background: transparent; border: 2px solid white; color: white; margin-left: 1rem;">Login</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero-section {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: white;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .hero-subtitle {
      font-size: 1.3rem;
      margin-bottom: 3rem;
      opacity: 0.9;
    }

    .hero-features {
      display: flex; /* Changed from grid to flex */
      justify-content: center; /* Center the boxes */
      gap: 2rem;
      margin: 3rem 0;
      flex-wrap: wrap; /* Allow wrapping on small screens */
    }

    .feature {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex: 1; /* Make boxes equal width */
      min-width: 250px; /* Minimum width for each box */
      max-width: 300px; /* Maximum width for each box */
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      display: block;
    }

    .feature h3 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
    }

    .feature p {
      opacity: 0.8;
      line-height: 1.5;
    }

    .hero-actions {
      margin-top: 2rem;
    }

    .btn-large {
      padding: 15px 30px;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      
      .hero-features {
        flex-direction: column; /* Stack vertically on mobile */
        align-items: center;
      }
      
      .feature {
        min-width: 100%; /* Full width on mobile */
        max-width: 100%;
      }
    }
  `]
})
export class HomeComponent { }