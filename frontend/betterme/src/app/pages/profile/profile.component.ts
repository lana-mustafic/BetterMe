import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, User } from '../../services/auth';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

interface UserStats {
  completedTasks: number;
  pendingTasks: number;
  totalTasks: number;
  overdueTasks: number;
  completionRate: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-page">
      <!-- Background Decoration -->
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="container">
        <div class="profile-container">
          <!-- Header Section -->
          <div class="profile-header">
            <div class="header-content">
              <h1 class="gradient-text">Your Profile</h1>
              <p class="subtitle">Track your progress and manage your account</p>
            </div>
          </div>

          <!-- Main Profile Card -->
          <div class="profile-card glass-card">
            @if (user; as user) {
              <!-- User Info Section -->
              <div class="user-section">
                <div class="user-avatar">
                  <div class="avatar-circle">
                    {{ getInitials(user.displayName) }}
                  </div>
                  <div class="online-indicator"></div>
                </div>
                <div class="user-info">
                  <h2 class="user-name">{{ user.displayName }}</h2>
                  <p class="user-email">{{ user.email }}</p>
                  <div class="member-badge">
                    <span class="badge-icon">⭐</span>
                    Member since {{ formatMemberSince(user.dateCreated) }}
                  </div>
                </div>
              </div>

              <!-- Loading State -->
              @if (isLoading) {
                <div class="loading-section">
                  <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                  </div>
                  <p>Analyzing your productivity...</p>
                </div>
              }

              <!-- Stats Section -->
              @if (!isLoading && !errorMessage) {
                <div class="stats-section">
                  <h3 class="section-title">Activity Overview</h3>
                  <div class="stats-grid">
                    <div class="stat-item" [class.active]="stats.totalTasks > 0">
                      <div class="stat-icon">📊</div>
                      <div class="stat-content">
                        <div class="stat-value">{{ stats.totalTasks }}</div>
                        <div class="stat-label">Total Tasks</div>
                      </div>
                    </div>
                    <div class="stat-item" [class.active]="stats.completedTasks > 0">
                      <div class="stat-icon">✅</div>
                      <div class="stat-content">
                        <div class="stat-value">{{ stats.completedTasks }}</div>
                        <div class="stat-label">Completed</div>
                      </div>
                    </div>
                    <div class="stat-item" [class.active]="stats.pendingTasks > 0">
                      <div class="stat-icon">⏳</div>
                      <div class="stat-content">
                        <div class="stat-value">{{ stats.pendingTasks }}</div>
                        <div class="stat-label">Pending</div>
                      </div>
                    </div>
                    <div class="stat-item" [class.active]="stats.overdueTasks > 0">
                      <div class="stat-icon">⚠️</div>
                      <div class="stat-content">
                        <div class="stat-value">{{ stats.overdueTasks }}</div>
                        <div class="stat-label">Overdue</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Progress Section -->
                  @if (stats.totalTasks > 0) {
                    <div class="progress-card">
                      <div class="progress-header">
                        <span class="progress-title">Completion Progress</span>
                        <span class="progress-percentage">{{ stats.completionRate }}%</span>
                      </div>
                      <div class="progress-track">
                        <div 
                          class="progress-fill" 
                          [style.width.%]="stats.completionRate"
                        ></div>
                      </div>
                      <div class="progress-stats">
                        <span>{{ stats.completedTasks }} of {{ stats.totalTasks }} tasks completed</span>
                      </div>
                    </div>
                  } @else {
                    <div class="empty-state">
                      <div class="empty-icon">📝</div>
                      <h3>No tasks yet</h3>
                      <p>Start your productivity journey by creating your first task</p>
                      <button class="btn btn-gradient" (click)="goToTasks()">
                        <span class="btn-icon">+</span>
                        Create First Task
                      </button>
                    </div>
                  }
                </div>
              }

              <!-- Error State -->
              @if (errorMessage) {
                <div class="error-card">
                  <div class="error-icon">⚠️</div>
                  <div class="error-content">
                    <h3>Something went wrong</h3>
                    <p>{{ errorMessage }}</p>
                  </div>
                  <button class="btn btn-outline" (click)="loadUserStats()">
                    Try Again
                  </button>
                </div>
              }

              <!-- Actions Section -->
              <div class="actions-section">
                <h3 class="section-title">Account Settings</h3>
                <div class="actions-grid">
                  <button class="action-btn" (click)="onEditProfile()">
                    <span class="action-icon">👤</span>
                    <span class="action-text">Edit Profile</span>
                    <span class="action-arrow">→</span>
                  </button>
                  <button class="action-btn" (click)="onChangePassword()">
                    <span class="action-icon">🔒</span>
                    <span class="action-text">Change Password</span>
                    <span class="action-arrow">→</span>
                  </button>
                  <button 
                    class="action-btn logout-btn" 
                    (click)="onLogout()"
                    [disabled]="isLoading"
                  >
                    <span class="action-icon">🚪</span>
                    <span class="action-text">Logout</span>
                    <span class="action-arrow">→</span>
                  </button>
                </div>
              </div>
            } @else {
              <!-- Not Logged In State -->
              <div class="auth-prompt">
                <div class="auth-icon">🔐</div>
                <h2>Access Your Profile</h2>
                <p>Sign in to view your personal statistics and manage your account</p>
                <button class="btn btn-gradient" (click)="goToLogin()">
                  Sign In to Continue
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
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
    }

    .profile-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header-content h1 {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transition: background 0.3s ease;
    }

    body.dark-mode .header-content h1 {
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.2rem;
      font-weight: 500;
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

    .user-section {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .user-avatar {
      position: relative;
    }

    .avatar-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .online-indicator {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 20px;
      height: 20px;
      background: #4ade80;
      border: 3px solid white;
      border-radius: 50%;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      color: white;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .user-email {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .member-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
    }

    .section-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-item.active {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-5px);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      color: white;
      font-size: 2rem;
      font-weight: 800;
      line-height: 1;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .progress-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .progress-title {
      color: white;
      font-weight: 600;
    }

    .progress-percentage {
      color: #4ade80;
      font-weight: 800;
      font-size: 1.2rem;
    }

    .progress-track {
      width: 100%;
      height: 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ade80, #22d3ee);
      border-radius: 10px;
      transition: width 1s ease-in-out;
      box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
    }

    .progress-stats {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: white;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }

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
    }

    .btn-gradient {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn-icon {
      font-weight: 700;
    }

    .actions-section {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .actions-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .action-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
    }

    .action-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(8px);
    }

    .logout-btn {
      color: #f87171;
    }

    .action-icon {
      font-size: 1.2rem;
    }

    .action-text {
      flex: 1;
      font-weight: 600;
      text-align: left;
    }

    .action-arrow {
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .action-btn:hover .action-arrow {
      opacity: 1;
    }

    .auth-prompt {
      text-align: center;
      padding: 4rem 2rem;
    }

    .auth-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }

    .auth-prompt h2 {
      color: white;
      margin-bottom: 1rem;
    }

    .auth-prompt p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }

    .loading-section {
      text-align: center;
      padding: 4rem 2rem;
      color: white;
    }

    .loading-spinner {
      margin-bottom: 1.5rem;
    }

    .spinner-ring {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    .error-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-content h3 {
      color: white;
      margin-bottom: 0.5rem;
    }

    .error-content p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .profile-container {
        padding: 1rem 0.5rem;
      }

      .glass-card {
        padding: 2rem 1.5rem;
      }

      .header-content h1 {
        font-size: 2.5rem;
      }

      .user-section {
        flex-direction: column;
        text-align: center;
        gap: 1.5rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .stat-item {
        padding: 1.25rem;
      }

      .progress-card {
        padding: 1.5rem;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .glass-card {
        padding: 1.5rem 1rem;
        border-radius: 20px;
      }

      .header-content h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .avatar-circle {
        width: 80px;
        height: 80px;
        font-size: 1.5rem;
      }

      .user-name {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  user: User | null = null;
  isLoading = false;
  errorMessage = '';
  stats: UserStats = {
    completedTasks: 0,
    pendingTasks: 0,
    totalTasks: 0,
    overdueTasks: 0,
    completionRate: 0
  };

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        if (user) {
          this.loadUserStats();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserStats(): void {
    if (!this.user) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTasks().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (tasks: Task[]) => {
        this.calculateStats(tasks);
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load your activity. Please try again.';
        this.isLoading = false;
        console.error('Error loading tasks:', error);
      }
    });
  }

  private calculateStats(tasks: Task[]): void {
    const now = new Date();
    
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    this.stats = {
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      pendingTasks: tasks.filter(task => !task.completed).length,
      overdueTasks: tasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < now
      ).length,
      completionRate: completionRate
    };
  }

  getInitials(displayName: string): string {
    return displayName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatMemberSince(dateString: string): string {
    try {
      if (!dateString) {
        return 'Recently';
      }

      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Recently';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
  }

  onEditProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  onChangePassword(): void {
    this.router.navigate(['/profile/change-password']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToTasks(): void {
    this.router.navigate(['/tasks']);
  }
}