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
    <div class="container">
      <div class="profile-container">
        <div class="profile-header">
          <h1>Your Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div class="profile-card">
          @if (user; as user) {
            <!-- User Info Section -->
            <div class="user-info">
              <div class="avatar">
                {{ getInitials(user.displayName) }}
              </div>
              <div class="user-details">
                <h2>{{ user.displayName }}</h2>
                <p class="user-email">{{ user.email }}</p>
                <p class="member-since">
                  Member since: {{ formatMemberSince(user.dateCreated) }}
                </p>
              </div>
            </div>

            <!-- Loading State -->
            @if (isLoading) {
              <div class="loading-section">
                <div class="spinner"></div>
                <p>Loading your activity...</p>
              </div>
            }

            <!-- Stats Section -->
            @if (!isLoading && !errorMessage) {
              <div class="stats-section">
                <h3>Your Activity</h3>
                <div class="stats-grid">
                  <div class="stat-card" [class.highlight]="stats.totalTasks > 0">
                    <div class="stat-number">{{ stats.totalTasks }}</div>
                    <div class="stat-label">Total Tasks</div>
                  </div>
                  <div class="stat-card" [class.highlight]="stats.completedTasks > 0">
                    <div class="stat-number">{{ stats.completedTasks }}</div>
                    <div class="stat-label">Completed</div>
                  </div>
                  <div class="stat-card" [class.highlight]="stats.pendingTasks > 0">
                    <div class="stat-number">{{ stats.pendingTasks }}</div>
                    <div class="stat-label">Pending</div>
                  </div>
                  <div class="stat-card" [class.highlight]="stats.overdueTasks > 0">
                    <div class="stat-number">{{ stats.overdueTasks }}</div>
                    <div class="stat-label">Overdue</div>
                  </div>
                </div>
                
                <!-- Progress Section -->
                @if (stats.totalTasks > 0) {
                  <div class="progress-section">
                    <div class="progress-header">
                      <span>Completion Rate</span>
                      <span class="progress-percentage">{{ stats.completionRate }}%</span>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        [style.width.%]="stats.completionRate"
                      ></div>
                    </div>
                  </div>
                } @else {
                  <div class="no-tasks-message">
                    <p>📝 You haven't created any tasks yet!</p>
                    <button class="btn btn-primary" (click)="goToTasks()">
                      Create Your First Task
                    </button>
                  </div>
                }
              </div>
            }

            <!-- Error State -->
            @if (errorMessage) {
              <div class="error-section">
                <p>{{ errorMessage }}</p>
                <button class="btn btn-retry" (click)="loadUserStats()">
                  Try Again
                </button>
              </div>
            }

            <!-- Actions Section -->
            <div class="actions-section">
              <h3>Account Actions</h3>
              <div class="actions-grid">
                <button class="btn btn-secondary" (click)="onEditProfile()">
                  <span class="icon">✏️</span>
                  Edit Profile
                </button>
                <button class="btn btn-secondary" (click)="onChangePassword()">
                  <span class="icon">🔒</span>
                  Change Password
                </button>
                <button 
                  class="btn btn-danger" 
                  (click)="onLogout()"
                  [disabled]="isLoading"
                >
                  <span class="icon">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          } @else {
            <!-- Not Logged In State -->
            <div class="not-logged-in">
              <div class="not-logged-in-icon">👤</div>
              <h2>Not Logged In</h2>
              <p>Please log in to view your profile and activity.</p>
              <button class="btn btn-primary" (click)="goToLogin()">
                Go to Login
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .profile-header h1 {
      color: #333;
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .profile-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .user-details h2 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }

    .user-email {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .member-since {
      color: #888;
      font-size: 0.9rem;
    }

    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-section h3 {
      color: #333;
      margin-bottom: 1.5rem;
      font-size: 1.3rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
    }

    .stat-card.highlight {
      border-color: #667eea;
      background: #f0f4ff;
      transform: translateY(-2px);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #666;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .progress-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      border: 2px solid #e9ecef;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: #333;
    }

    .progress-percentage {
      color: #667eea;
      font-weight: 700;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .no-tasks-message {
      text-align: center;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px dashed #dee2e6;
    }

    .no-tasks-message p {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .actions-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #f0f0f0;
    }

    .actions-section h3 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      position: relative;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn-retry {
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      margin-top: 1rem;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .icon {
      font-size: 1.1rem;
    }

    .loading-section {
      text-align: center;
      padding: 2rem;
      color: #667eea;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-section {
      background: #fee;
      color: #c33;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 1rem;
      border: 1px solid #fcc;
    }

    .not-logged-in {
      text-align: center;
      padding: 3rem;
    }

    .not-logged-in-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .not-logged-in h2 {
      color: #333;
      margin-bottom: 1rem;
    }

    .not-logged-in p {
      color: #666;
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: 1rem 0.5rem;
      }

      .profile-card {
        padding: 1.5rem;
      }

      .user-info {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .btn {
        font-size: 14px;
        padding: 10px 16px;
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
    // Subscribe to user changes
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

  // New methods for button actions
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