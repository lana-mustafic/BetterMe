// habit-tracker.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { Habit, HabitStats, HabitCategory, LevelSystem, CreateHabitRequest, UpdateHabitRequest } from '../../models/habit.model';

interface ActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0: no activity, 4: max activity
  habits: Habit[];
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  weekIndex?: number; // Week number (0-52)
  isWithinRange: boolean; // True if the day falls within the past 365 days
}

interface MonthMarker {
  label: string;
  weeks: number;
}

@Component({
  selector: 'app-habit-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="habit-tracker-page">
      <!-- Background Animation -->
      <div class="background-animation">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
      </div>

      <div class="container">
        <div class="habit-container">
          <!-- Header Section -->
          <div class="habit-header glass-card">
            <div class="header-content">
              <h1 class="gradient-text">Activity Tracker</h1>
              <p class="subtitle">Build consistency, one day at a time 🚀</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-gradient" (click)="showCreateForm = true">
                <span class="btn-icon">+</span>
                New Activity
              </button>
              <button class="btn btn-outline" (click)="activeView = 'stats'">
                <span class="btn-icon">📊</span>
                View Stats
              </button>
            </div>
          </div>

          <!-- Level Progress -->
          <div class="level-progress glass-card" *ngIf="levelSystem">
            <div class="level-header">
              <div class="level-info">
                <span class="level-badge">Level {{ levelSystem.level }}</span>
                <span class="level-points">{{ levelSystem.points }} XP</span>
              </div>
              <div class="next-level">
                {{ levelSystem.pointsToNextLevel }} XP to next level
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="levelSystem.progress"></div>
            </div>
            <div class="level-rewards" *ngIf="levelSystem.rewards.length > 0">
              <strong>Unlocked:</strong>
              <span class="rewards-list">{{ levelSystem.rewards.join(' • ') }}</span>
            </div>
          </div>

          <!-- View Toggle -->
          <div class="view-toggle-container">
            <div class="view-toggle">
              <button 
                class="toggle-btn" 
                [class.active]="activeView === 'activity'"
                (click)="activeView = 'activity'"
              >
                <span class="toggle-icon">📅</span>
                <span class="toggle-text">Activity Grid</span>
              </button>
              <button 
                class="toggle-btn" 
                [class.active]="activeView === 'today'"
                (click)="activeView = 'today'"
              >
                <span class="toggle-icon">🎯</span>
                <span class="toggle-text">Today</span>
              </button>
              <button 
                class="toggle-btn" 
                [class.active]="activeView === 'all'"
                (click)="activeView = 'all'"
              >
                <span class="toggle-icon">📋</span>
                <span class="toggle-text">All Activities</span>
              </button>
              <button 
                class="toggle-btn" 
                [class.active]="activeView === 'stats'"
                (click)="activeView = 'stats'"
              >
                <span class="toggle-icon">📈</span>
                <span class="toggle-text">Statistics</span>
              </button>
            </div>
          </div>

          <!-- Activity Calendar View -->
          <div *ngIf="activeView === 'activity'" class="activity-view">
            <div class="activity-calendar-section glass-card">
              <div class="calendar-header">
                <h3>Activity Calendar</h3>
                <p class="activity-subtitle">Your consistency from January to December</p>
              </div>
              
              <!-- GitHub-style Contribution Graph -->
              <div class="contribution-graph">
                <!-- Month labels row -->
                <div class="graph-months">
                  <div class="day-labels-column"></div>
                  <div class="months-row">
                    <div 
                      *ngFor="let marker of monthMarkers" 
                      class="month-marker"
                      [style.width.px]="getMonthMarkerWidth(marker.weeks)"
                    >
                      {{ marker.label }}
                    </div>
                  </div>
                </div>

                <!-- Main grid -->
                <div class="graph-container">
                  <!-- Day labels column -->
                  <div class="day-labels-column">
                    <div class="day-label" *ngFor="let dayLabel of dayLabels">{{ dayLabel }}</div>
                  </div>

                  <!-- Weeks grid -->
                  <div class="weeks-grid">
                    <div *ngFor="let week of activityWeeks; let weekIndex = index" class="week-column">
                      <div 
                        *ngFor="let day of week; let dayIndex = index" 
                        class="contribution-day"
                        [class]="'activity-level-' + day.level"
                        [class.today]="isToday(day.date)"
                        [class.future-day]="isFutureDay(day.date)"
                        [title]="getActivityTooltip(day)"
                        (click)="selectActivityDay(day)"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="activity-legend">
                <div class="legend-text">
                  <span class="legend-label">Less</span>
                  <div class="legend-squares">
                    <div class="legend-square level-0"></div>
                    <div class="legend-square level-1"></div>
                    <div class="legend-square level-2"></div>
                    <div class="legend-square level-3"></div>
                    <div class="legend-square level-4"></div>
                  </div>
                  <span class="legend-label">More</span>
                </div>
              </div>
            </div>

            <!-- Selected Day Details -->
            <div *ngIf="selectedActivityDay" class="selected-day-details glass-card">
              <h4>Activity on {{ formatSelectedDate(selectedActivityDay.date) }}</h4>
              <div *ngIf="selectedActivityDay.count > 0; else noActivity">
                <p><strong>{{ selectedActivityDay.count }}</strong> activity completed</p>
                <div class="completed-habits">
                  <div *ngFor="let habit of selectedActivityDay.habits" class="completed-habit">
                    <span class="habit-icon">{{ habit.icon }}</span>
                    <span class="habit-name">{{ habit.name }}</span>
                    <span class="habit-points">+{{ habit.points }} XP</span>
                  </div>
                </div>
              </div>
              <ng-template #noActivity>
                <p>No activities completed on this day</p>
              </ng-template>
            </div>
          </div>

          <!-- Today's Activities View -->
          <div *ngIf="activeView === 'today'" class="today-view">
            <!-- Daily Stats -->
            <div class="daily-stats glass-card">
              <div class="stat-item">
                <span class="stat-number">{{ todayHabits.length }}</span>
                <span class="stat-label">Due Today</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ getCompletedTodayCount() }}</span>
                <span class="stat-label">Completed</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ getTodayCompletionRate() }}%</span>
                <span class="stat-label">Progress</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ getTotalPointsToday() }}</span>
                <span class="stat-label">Points Earned</span>
              </div>
            </div>

            <!-- Today's Activities List -->
            <div class="habits-list">
              <div *ngFor="let habit of todayHabits" class="habit-card glass-card" 
                   [class.completed]="isHabitCompletedToday(habit)">
                <div class="habit-header">
                  <div class="habit-info">
                    <span class="habit-icon">{{ habit.icon }}</span>
                    <div class="habit-details">
                      <h3 class="habit-name">{{ habit.name }}</h3>
                      <div class="habit-meta">
                        <span class="habit-category" [style.background]="habit.color + '20'" [style.color]="habit.color">
                          {{ habit.category }}
                        </span>
                        <span class="habit-frequency">{{ habit.frequency }}</span>
                        <span class="habit-difficulty" [class]="'difficulty-' + habit.difficulty">
                          {{ habit.difficulty }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="habit-points">
                    +{{ habit.points }} XP
                  </div>
                </div>

                <div class="habit-progress">
                  <div class="progress-info">
                    <span class="streak-count">
                      🔥 {{ habit.streak }} day streak
                    </span>
                    <span class="best-streak">
                      Best: {{ habit.bestStreak }}
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="getHabitCompletionRate(habit)"></div>
                  </div>
                  <div class="progress-text">
                    {{ habit.currentCount }}/{{ habit.targetCount }} this {{ habit.frequency }}
                  </div>
                </div>

                <div class="habit-actions">
                  <button 
                    *ngIf="!isHabitCompletedToday(habit)"
                    class="btn btn-primary complete-btn" 
                    (click)="completeHabit(habit.id)"
                  >
                    <span class="btn-icon">✓</span>
                    Mark Complete
                  </button>
                  <button 
                    *ngIf="isHabitCompletedToday(habit)"
                    class="btn btn-outline undo-btn" 
                    (click)="uncompleteHabit(habit.id)"
                  >
                    <span class="btn-icon">↶</span>
                    Undo
                  </button>
                  <button class="btn-icon" (click)="editHabit(habit)">
                    <span class="btn-icon">✏️</span>
                  </button>
                </div>
              </div>

              <div *ngIf="todayHabits.length === 0" class="empty-state glass-card">
                <div class="empty-content">
                  <span class="empty-icon">🎉</span>
                  <h3>No activities due today!</h3>
                  <p>Take a break or add new activities to track.</p>
                  <button class="btn btn-gradient" (click)="showCreateForm = true">
                    Create New Activity
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- All Activities View -->
          <div *ngIf="activeView === 'all'" class="all-habits-view">
            <div class="habits-list">
              <div *ngFor="let habit of habits" class="habit-card glass-card" 
                   [class.completed]="isHabitCompletedToday(habit)">
                <div class="habit-header">
                  <div class="habit-info">
                    <span class="habit-icon">{{ habit.icon }}</span>
                    <div class="habit-details">
                      <h3 class="habit-name">{{ habit.name }}</h3>
                      <div class="habit-meta">
                        <span class="habit-category" [style.background]="habit.color + '20'" [style.color]="habit.color">
                          {{ habit.category }}
                        </span>
                        <span class="habit-frequency">{{ habit.frequency }}</span>
                        <span class="habit-difficulty" [class]="'difficulty-' + habit.difficulty">
                          {{ habit.difficulty }}
                        </span>
                        <span class="habit-status" [class.active]="habit.isActive" [class.inactive]="!habit.isActive">
                          {{ habit.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="habit-points">
                    +{{ habit.points }} XP
                  </div>
                </div>

                <div class="habit-progress">
                  <div class="progress-info">
                    <span class="streak-count">
                      🔥 {{ habit.streak }} day streak
                    </span>
                    <span class="best-streak">
                      Best: {{ habit.bestStreak }}
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="getHabitCompletionRate(habit)"></div>
                  </div>
                  <div class="progress-text">
                    {{ habit.currentCount }}/{{ habit.targetCount }} this {{ habit.frequency }}
                  </div>
                </div>

                <div class="habit-actions">
                  <button 
                    *ngIf="!isHabitCompletedToday(habit) && habit.isActive"
                    class="btn btn-primary complete-btn" 
                    (click)="completeHabit(habit.id)"
                  >
                    <span class="btn-icon">✓</span>
                    Mark Complete
                  </button>
                  <button 
                    *ngIf="isHabitCompletedToday(habit) && habit.isActive"
                    class="btn btn-outline undo-btn" 
                    (click)="uncompleteHabit(habit.id)"
                  >
                    <span class="btn-icon">↶</span>
                    Undo
                  </button>
                  <button class="btn-icon" (click)="editHabit(habit)">
                    <span class="btn-icon">✏️</span>
                  </button>
                  <button class="btn-icon" (click)="toggleHabitActive(habit)">
                    <span class="btn-icon">{{ habit.isActive ? '⏸️' : '▶️' }}</span>
                  </button>
                </div>
              </div>

              <div *ngIf="habits.length === 0" class="empty-state glass-card">
                <div class="empty-content">
                  <span class="empty-icon">📝</span>
                  <h3>No activities yet!</h3>
                  <p>Start building your routine by creating your first activity.</p>
                  <button class="btn btn-gradient" (click)="showCreateForm = true">
                    Create Your First Activity
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics View -->
          <div *ngIf="activeView === 'stats' && habitStats" class="stats-view">
            <div class="stats-grid">
              <div class="stat-card glass-card">
                <div class="stat-content">
                  <span class="stat-icon">📊</span>
                  <div class="stat-data">
                    <div class="stat-number">{{ habitStats.totalHabits }}</div>
                    <div class="stat-label">Total Activities</div>
                  </div>
                </div>
              </div>

              <div class="stat-card glass-card">
                <div class="stat-content">
                  <span class="stat-icon">🔥</span>
                  <div class="stat-data">
                    <div class="stat-number">{{ habitStats.currentStreak }}</div>
                    <div class="stat-label">Current Streak</div>
                  </div>
                </div>
              </div>

              <div class="stat-card glass-card">
                <div class="stat-content">
                  <span class="stat-icon">⭐</span>
                  <div class="stat-data">
                    <div class="stat-number">{{ habitStats.longestStreak }}</div>
                    <div class="stat-label">Longest Streak</div>
                  </div>
                </div>
              </div>

              <div class="stat-card glass-card">
                <div class="stat-content">
                  <span class="stat-icon">🎯</span>
                  <div class="stat-data">
                    <div class="stat-number">{{ habitStats.successRate | number:'1.0-0' }}%</div>
                    <div class="stat-label">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Weekly Progress Chart -->
            <div class="chart-section glass-card">
              <h3>Weekly Progress</h3>
              <div class="weekly-chart">
                <div *ngFor="let day of habitStats.weeklyProgress" class="chart-day">
                  <div class="chart-bar-container">
                    <div class="chart-bar" [style.height.%]="(day.completions / getMaxCompletions()) * 100"></div>
                  </div>
                  <span class="chart-label">{{ formatChartDate(day.date) }}</span>
                  <span class="chart-value">{{ day.completions }}</span>
                </div>
              </div>
            </div>

            <!-- Category Breakdown -->
            <div class="category-section glass-card">
              <h3>Activities by Category</h3>
              <div class="category-list">
                <div *ngFor="let category of habitStats.categoryBreakdown" class="category-item">
                  <div class="category-header">
                    <span class="category-name">{{ category.category }}</span>
                    <span class="category-stats">{{ category.completed }}/{{ category.count }}</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      [style.width.%]="(category.completed / category.count) * 100"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Create/Edit Activity Modal -->
          <div *ngIf="showCreateForm" class="modal-overlay" (click)="closeModal()">
            <div class="modal-content glass-card" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3>{{ editingHabit ? 'Edit Activity' : 'Create New Activity' }}</h3>
                <button class="close-btn" (click)="closeModal()">×</button>
              </div>
              
              <div class="modal-body">
                <form (ngSubmit)="onSaveHabit()" #habitForm="ngForm">
                  <div class="form-group">
                    <label class="form-label">Activity Name *</label>
                    <input 
                      type="text" 
                      class="form-control"
                      placeholder="e.g., Morning Meditation"
                      [(ngModel)]="newHabit.name"
                      name="name"
                      required
                      #name="ngModel"
                    />
                    <div *ngIf="name.invalid && (name.dirty || name.touched)" class="error-message">
                      Activity name is required
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea 
                      class="form-control"
                      placeholder="Describe your activity..."
                      [(ngModel)]="newHabit.description"
                      name="description"
                      rows="2"
                    ></textarea>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Frequency *</label>
                      <select 
                        class="form-control"
                        [(ngModel)]="newHabit.frequency"
                        name="frequency"
                        required
                        #frequency="ngModel"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Target Count *</label>
                      <input 
                        type="number" 
                        class="form-control"
                        [(ngModel)]="newHabit.targetCount"
                        name="targetCount"
                        min="1"
                        max="100"
                        required
                        #targetCount="ngModel"
                      />
                      <div *ngIf="targetCount.invalid && (targetCount.dirty || targetCount.touched)" class="error-message">
                        Target count must be between 1 and 100
                      </div>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Category *</label>
                      <select 
                        class="form-control"
                        [(ngModel)]="newHabit.category"
                        name="category"
                        required
                        #category="ngModel"
                      >
                        <option *ngFor="let category of categories" [value]="category.name">
                          {{ category.icon }} {{ category.name }}
                        </option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Difficulty *</label>
                      <select 
                        class="form-control"
                        [(ngModel)]="newHabit.difficulty"
                        name="difficulty"
                        required
                        #difficulty="ngModel"
                      >
                        <option value="easy">😊 Easy</option>
                        <option value="medium">😐 Medium</option>
                        <option value="hard">😰 Hard</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Icon</label>
                      <input 
                        type="text" 
                        class="form-control"
                        placeholder="e.g., 🏃‍♂️"
                        [(ngModel)]="newHabit.icon"
                        name="icon"
                        maxlength="2"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Color</label>
                      <div class="color-input-container">
                        <input 
                          type="color" 
                          class="form-control color-picker"
                          [(ngModel)]="newHabit.color"
                          name="color"
                        />
                        <span class="color-value">{{ newHabit.color }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Points per Completion</label>
                    <input 
                      type="number" 
                      class="form-control"
                      [(ngModel)]="newHabit.points"
                      name="points"
                      min="1"
                      max="100"
                    />
                  </div>

                  <div class="form-actions">
                    <button 
                      type="submit" 
                      class="btn btn-primary"
                      [disabled]="!habitForm.form.valid"
                    >
                      {{ editingHabit ? 'Update Activity' : 'Create Activity' }}
                    </button>
                    <button type="button" class="btn btn-secondary" (click)="closeModal()">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .habit-tracker-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
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

    .shape-1 { width: 200px; height: 200px; top: 10%; left: 5%; animation-delay: 0s; }
    .shape-2 { width: 150px; height: 150px; top: 60%; right: 10%; animation-delay: 2s; }
    .shape-3 { width: 100px; height: 100px; bottom: 20%; left: 15%; animation-delay: 4s; }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .container {
      position: relative;
      z-index: 1;
      padding: 2rem 1rem;
    }

    .habit-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .habit-header {
      padding: 2rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content h1 {
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
    }

    .header-actions {
      display: flex;
      gap: 1rem;
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
    }

    .btn-gradient {
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      color: white;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    /* Level Progress */
    .level-progress {
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .level-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .level-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .level-badge {
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .level-points {
      color: white;
      font-weight: 600;
    }

    .next-level {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .progress-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ade80, #22d3ee);
      border-radius: 4px;
      transition: width 0.5s ease-in-out;
    }

    .level-rewards {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .rewards-list {
      margin-left: 0.5rem;
    }

    /* View Toggle */
    .view-toggle-container {
      margin-bottom: 2rem;
    }

    .view-toggle {
      display: inline-flex;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      padding: 0.5rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      transition: all 0.3s ease;
    }

    .toggle-btn.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
    }

    /* Activity Calendar Styles */
    .activity-view {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .activity-calendar-section {
      padding: 2rem;
    }

    .calendar-header {
      margin-bottom: 2rem;
    }

    .calendar-header h3 {
      color: white;
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
    }

    .activity-subtitle {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 0;
    }

    /* GitHub-style Contribution Graph */
    .contribution-graph {
      margin-bottom: 1.5rem;
      overflow-x: auto;
    }

    .graph-months {
      display: flex;
      margin-bottom: 4px;
      padding-left: 27px;
    }

    .day-labels-column {
      width: 27px;
      flex-shrink: 0;
    }

    .months-row {
      display: flex;
      flex: 1;
    }

    .month-marker {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.7rem;
      font-weight: 500;
      text-align: left;
      padding-left: 2px;
      box-sizing: border-box;
      line-height: 1;
    }

    .graph-container {
      display: flex;
      gap: 0;
    }

    .day-labels-column {
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: 27px;
      flex-shrink: 0;
      padding-top: 2px;
    }

    .day-label {
      height: 10px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.7rem;
      font-weight: 400;
      text-align: right;
      padding-right: 8px;
      line-height: 10px;
    }

    .weeks-grid {
      display: flex;
      gap: 3px;
      flex: 1;
    }

    .week-column {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .contribution-day {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
      outline: 1px solid rgba(255, 255, 255, 0.05);
    }

    .contribution-day:hover:not(.future-day) {
      outline: 1.5px solid rgba(255, 255, 255, 0.8);
      outline-offset: -1.5px;
      z-index: 10;
    }

    .contribution-day.today {
      outline: 2px solid #4ade80;
      outline-offset: -2px;
    }

    .contribution-day.future-day {
      opacity: 0.2;
      cursor: default;
    }

    .contribution-day.future-day:hover {
      outline: 1px solid rgba(255, 255, 255, 0.05);
      outline-offset: -1px;
    }

    /* Activity level colors - GitHub green scheme */
    .contribution-day.activity-level-0 {
      background: #161b22;
      outline-color: #30363d;
    }

    .contribution-day.activity-level-1 {
      background: #0e4429;
    }

    .contribution-day.activity-level-2 {
      background: #006d32;
    }

    .contribution-day.activity-level-3 {
      background: #26a641;
    }

    .contribution-day.activity-level-4 {
      background: #39d353;
    }

    .activity-legend {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 1rem;
      padding: 0 0.5rem;
    }

    .legend-text {
      display: flex;
      align-items: center;
      gap: 4px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.7rem;
    }

    .legend-label {
      font-weight: 400;
    }

    .legend-squares {
      display: flex;
      gap: 3px;
      align-items: center;
    }

    .legend-square {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      outline: 1px solid rgba(255, 255, 255, 0.05);
    }

    .legend-square.level-0 {
      background: #161b22;
      outline-color: #30363d;
    }

    .legend-square.level-1 {
      background: #0e4429;
    }

    .legend-square.level-2 {
      background: #006d32;
    }

    .legend-square.level-3 {
      background: #26a641;
    }

    .legend-square.level-4 {
      background: #39d353;
    }

    .selected-day-details {
      padding: 1.5rem;
    }

    .selected-day-details h4 {
      color: white;
      margin-bottom: 1rem;
    }

    .completed-habits {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .completed-habit {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }

    .completed-habit .habit-name {
      color: white;
      font-weight: 500;
      flex: 1;
    }

    .completed-habit .habit-points {
      color: #4ade80;
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* Today's Habits */
    .daily-stats {
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    /* Habit Cards */
    .habits-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .habit-card {
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    .habit-card.completed {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(74, 222, 128, 0.2) 100%);
      border-color: rgba(74, 222, 128, 0.5);
    }

    .habit-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    }

    .habit-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .habit-info {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      flex: 1;
    }

    .habit-icon {
      font-size: 2rem;
      margin-top: 0.25rem;
    }

    .habit-details {
      flex: 1;
    }

    .habit-name {
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .habit-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .habit-category, .habit-frequency, .habit-difficulty, .habit-status {
      padding: 0.3rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .habit-frequency {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    .habit-difficulty.easy {
      background: rgba(34, 197, 94, 0.3);
      color: #bbf7d0;
    }

    .habit-difficulty.medium {
      background: rgba(245, 158, 11, 0.3);
      color: #fed7aa;
    }

    .habit-difficulty.hard {
      background: rgba(239, 68, 68, 0.3);
      color: #fecaca;
    }

    .habit-status.active {
      background: rgba(34, 197, 94, 0.3);
      color: #bbf7d0;
    }

    .habit-status.inactive {
      background: rgba(100, 116, 139, 0.3);
      color: #cbd5e1;
    }

    .habit-points {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .habit-progress {
      margin-bottom: 1.5rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .streak-count, .best-streak {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .progress-text {
      text-align: center;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .habit-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .complete-btn {
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      color: white;
      flex: 1;
    }

    .undo-btn {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      flex: 1;
    }

    /* Statistics View */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 2rem;
      text-align: center;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .chart-section, .category-section {
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .chart-section h3, .category-section h3 {
      color: white;
      margin-bottom: 1.5rem;
      font-size: 1.3rem;
    }

    .weekly-chart {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 200px;
      gap: 1rem;
    }

    .chart-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .chart-bar-container {
      height: 150px;
      width: 30px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .chart-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, #4ade80, #22d3ee);
      border-radius: 8px;
      transition: height 0.5s ease;
    }

    .chart-label, .chart-value {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .category-item {
      margin-bottom: 1rem;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .category-name {
      color: white;
      font-weight: 600;
    }

    .category-stats {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }

    .modal-content {
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem 2rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .modal-header h3 {
      margin: 0;
      color: white;
      font-size: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .modal-body {
      padding: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: white;
    }

    .form-control {
      width: 100%;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      background: rgba(255, 255, 255, 0.15);
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .color-input-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .color-picker {
      height: 48px;
      padding: 0.5rem;
      flex: 0 0 60px;
    }

    .color-value {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      flex: 1;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      flex: 1;
    }

    .error-message {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    /* Empty State */
    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-content {
      max-width: 300px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.7;
    }

    .empty-state h3 {
      color: white;
      margin-bottom: 1rem;
    }

    .empty-state p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .habit-header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .daily-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .habit-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .habit-info {
        flex-direction: column;
        align-items: flex-start;
      }

      .habit-meta {
        flex-direction: column;
        align-items: flex-start;
      }

      .habit-actions {
        flex-wrap: wrap;
      }

      /* Mobile adjustments for contribution graph */
      .contribution-graph {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .graph-months {
        padding-left: 25px;
      }

      .day-labels-column {
        width: 25px;
      }

      .day-label {
        font-size: 0.65rem;
        padding-right: 4px;
      }

      .contribution-day {
        width: 10px;
        height: 10px;
      }

      .month-marker {
        font-size: 0.65rem;
      }

      .activity-legend {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 1rem 0.5rem;
      }

      .habit-header {
        padding: 1.5rem;
      }

      .header-content h1 {
        font-size: 2rem;
      }

      .daily-stats, .stats-grid {
        grid-template-columns: 1fr;
      }

      .weekly-chart {
        flex-direction: column;
        height: auto;
        align-items: center;
      }

      .chart-day {
        flex-direction: row;
        width: 100%;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .chart-bar-container {
        width: 100%;
        height: 30px;
      }

      .chart-bar {
        width: 100%;
        height: 100%;
      }

      .color-input-container {
        flex-direction: column;
        align-items: flex-start;
      }

      .contribution-day {
        width: 8px;
        height: 8px;
      }

      .legend-square {
        width: 8px;
        height: 8px;
      }

      .day-labels-column {
        width: 20px;
      }

      .day-label {
        font-size: 0.6rem;
      }

      .month-marker {
        font-size: 0.6rem;
      }

    }
  `]
})
export class HabitTrackerComponent implements OnInit {
  private habitService = inject(HabitService);

  habits: Habit[] = [];
  todayHabits: Habit[] = [];
  habitStats: HabitStats | null = null;
  levelSystem: LevelSystem | null = null;
  categories: HabitCategory[] = [];

  // Activity Grid
  activityWeeks: ActivityDay[][] = [];
  monthMarkers: MonthMarker[] = [];
  readonly squareSize = 10;
  readonly squareGap = 3;
  selectedActivityDay: ActivityDay | null = null;
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  days: string[] = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
  calendarMonths: any[] = [];
  weekDayNames: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayLabels: string[] = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  get weekColumnWidth(): number {
    return this.squareSize + this.squareGap;
  }

  getGridWidth(): number {
    const columns = this.activityWeeks.length;
    if (!columns) {
      return 0;
    }
    return columns * this.squareSize + Math.max(0, columns - 1) * this.squareGap;
  }

  getMonthMarkerWidth(weeks: number): number {
    if (weeks <= 0) {
      return 0;
    }
    // Each week column is squareSize + squareGap, but the last week doesn't have a gap after it
    return weeks * (this.squareSize + this.squareGap) - this.squareGap;
  }

  activeView: 'activity' | 'today' | 'all' | 'stats' = 'activity';
  showCreateForm = false;
  editingHabit: Habit | null = null;

  newHabit: CreateHabitRequest = {
    name: '',
    description: '',
    frequency: 'daily',
    targetCount: 1,
    category: 'Health & Fitness',
    color: '#4ade80',
    icon: '✅',
    difficulty: 'easy',
    points: 10,
    tags: []
  };

  ngOnInit(): void {
    this.loadHabits();
    this.categories = this.habitService.getCategories();
    this.generateActivityGrid();
  }

  loadHabits(): void {
    this.habitService.getHabits().subscribe({
      next: (habits) => {
        this.habits = habits;
        this.updateTodayHabits();
        this.generateActivityGrid();
        this.checkGridCompleteness(); // Debug check
      },
      error: (error) => {
        console.error('Error loading habits:', error);
        alert('Error loading activities. Please try again.');
      }
    });

    this.habitService.getHabitStats().subscribe({
      next: (stats) => {
        this.habitStats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });

    this.habitService.getLevelSystem().subscribe({
      next: (levelSystem) => {
        this.levelSystem = levelSystem;
      },
      error: (error) => {
        console.error('Error loading level system:', error);
      }
    });

    this.habitService.getTodayHabits().subscribe({
      next: (habits) => {
        this.todayHabits = habits;
      },
      error: (error) => {
        console.error('Error loading today\'s habits:', error);
      }
    });
  }

  generateActivityGrid(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate grid for current year: January 1 to December 31
    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1
    const endDate = new Date(currentYear, 11, 31); // December 31
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // Align the grid to start on Sunday (GitHub style) and end on Saturday for complete weeks
    const gridStart = new Date(startDate);
    while (gridStart.getDay() !== 0) {
      gridStart.setDate(gridStart.getDate() - 1);
    }

    const gridEnd = new Date(endDate);
    while (gridEnd.getDay() !== 6) {
      gridEnd.setDate(gridEnd.getDate() + 1);
    }

    const weeks: ActivityDay[][] = [];
    const weekMonthNames: (string | null)[] = [];

    let currentDate = new Date(gridStart);
    let currentWeek: ActivityDay[] = [];

    while (currentDate <= gridEnd) {
      const dateString = currentDate.toISOString().split('T')[0];
      const isWithinRange = currentDate >= startDate && currentDate <= endDate;

      const completions = isWithinRange
        ? this.habits.reduce((count, habit) => count + (habit.completedDates.includes(dateString) ? 1 : 0), 0)
        : 0;

      const completedHabits = isWithinRange
        ? this.habits.filter(habit => habit.completedDates.includes(dateString))
        : [];

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (completions > 0) level = 1;
      if (completions > 2) level = 2;
      if (completions > 4) level = 3;
      if (completions > 6) level = 4;

      const activityDay: ActivityDay = {
        date: dateString,
        count: completions,
        level,
        habits: completedHabits,
        dayOfWeek: currentDate.getDay(),
        weekIndex: weeks.length,
        isWithinRange
      };

      currentWeek.push(activityDay);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);

        // Get the first day of the week that's within the year range for month label
        const firstValidDay = currentWeek.find(day => day.isWithinRange);
        if (firstValidDay) {
          const monthIndex = new Date(firstValidDay.date).getMonth();
          weekMonthNames.push(this.months[monthIndex]);
        } else {
          // Check if week is before January or after December
          const firstDayDate = new Date(currentWeek[0].date);
          if (firstDayDate < startDate) {
            weekMonthNames.push(null); // Before January
          } else {
            weekMonthNames.push(null); // After December
          }
        }

        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.activityWeeks = weeks;

    // Build month markers for header
    const markers: MonthMarker[] = [];
    let currentLabel: string | null = null;
    let span = 0;

    weekMonthNames.forEach(label => {
      const normalized = label ?? '';
      if (currentLabel === null) {
        currentLabel = normalized;
        span = 1;
        return;
      }

      if (normalized !== currentLabel) {
        if (currentLabel !== '') {
          markers.push({ label: currentLabel, weeks: span });
        }
        currentLabel = normalized;
        span = 1;
      } else {
        span += 1;
      }
    });

    if (currentLabel !== null && currentLabel !== '') {
      markers.push({ label: currentLabel, weeks: span });
    }

    this.monthMarkers = markers;
  }

  getDayNumber(dateString: string): number {
    return new Date(dateString).getDate();
  }

  isToday(dateString: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  }

  isFutureDay(dateString: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime() > today.getTime();
  }

  checkGridCompleteness(): void {
    const totalTrackedDays = this.activityWeeks.reduce(
      (sum, week) => sum + week.filter(day => day.isWithinRange).length,
      0
    );

    const allDays = this.activityWeeks.flat().filter(day => day.isWithinRange);
    const firstDate = allDays[0]?.date ?? 'N/A';
    const lastDate = allDays[allDays.length - 1]?.date ?? 'N/A';

    console.log('Total tracked days in grid:', totalTrackedDays);
    console.log('First tracked date:', firstDate);
    console.log('Last tracked date:', lastDate);

    // Check for 365 or 366 days (leap year)
    const currentYear = new Date().getFullYear();
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const expectedDays = isLeapYear ? 366 : 365;

    if (totalTrackedDays !== expectedDays) {
      console.warn(`Grid has ${totalTrackedDays} days within range, expected ${expectedDays}`);
    }
  }

  getActivityTooltip(day: ActivityDay): string {
    if (day.count === 0) {
      return `No activity on ${this.formatSelectedDate(day.date)}`;
    }
    return `${day.count} ${day.count === 1 ? 'activity' : 'activities'} completed on ${this.formatSelectedDate(day.date)}`;
  }

  selectActivityDay(day: ActivityDay): void {
    this.selectedActivityDay = day;
  }

  formatSelectedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  updateTodayHabits(): void {
    this.todayHabits = this.habits.filter(habit => 
      habit.isActive && this.habitService.isHabitDueToday(habit)
    );
  }

  completeHabit(habitId: string): void {
    this.habitService.completeHabit(habitId).subscribe({
      next: () => {
        this.loadHabits();
      },
      error: (error) => {
        console.error('Error completing habit:', error);
        alert('Error completing activity. Please try again.');
      }
    });
  }

  uncompleteHabit(habitId: string): void {
    const today = new Date().toISOString().split('T')[0];
    this.habitService.uncompleteHabit(habitId, today).subscribe({
      next: () => {
        this.loadHabits();
      },
      error: (error) => {
        console.error('Error uncompleting habit:', error);
        alert('Error uncompleting activity. Please try again.');
      }
    });
  }

  toggleHabitActive(habit: Habit): void {
    const updates: UpdateHabitRequest = { isActive: !habit.isActive };
    this.habitService.updateHabit(habit.id, updates).subscribe({
      next: () => {
        this.loadHabits();
      },
      error: (error) => {
        console.error('Error toggling habit:', error);
        alert('Error updating activity. Please try again.');
      }
    });
  }

  isHabitCompletedToday(habit: Habit): boolean {
    const today = new Date().toISOString().split('T')[0];
    return habit.completedDates.includes(today);
  }

  getHabitCompletionRate(habit: Habit): number {
    return this.habitService.getHabitCompletionRate(habit);
  }

  getCompletedTodayCount(): number {
    return this.todayHabits.filter(habit => this.isHabitCompletedToday(habit)).length;
  }

  getTodayCompletionRate(): number {
    if (this.todayHabits.length === 0) return 0;
    return Math.round((this.getCompletedTodayCount() / this.todayHabits.length) * 100);
  }

  getTotalPointsToday(): number {
    return this.todayHabits
      .filter(habit => this.isHabitCompletedToday(habit))
      .reduce((sum, habit) => sum + habit.points, 0);
  }

  editHabit(habit: Habit): void {
    this.editingHabit = habit;
    this.newHabit = {
      name: habit.name,
      description: habit.description || '',
      frequency: habit.frequency,
      targetCount: habit.targetCount,
      category: habit.category,
      color: habit.color,
      icon: habit.icon,
      difficulty: habit.difficulty,
      points: habit.points,
      reminderTime: habit.reminderTime,
      tags: [...habit.tags]
    };
    this.showCreateForm = true;
  }

  onSaveHabit(): void {
    if (this.editingHabit) {
      // Update existing habit
      const updateData: UpdateHabitRequest = {
        name: this.newHabit.name,
        description: this.newHabit.description,
        frequency: this.newHabit.frequency,
        targetCount: this.newHabit.targetCount,
        category: this.newHabit.category,
        color: this.newHabit.color,
        icon: this.newHabit.icon,
        difficulty: this.newHabit.difficulty,
        points: this.newHabit.points,
        reminderTime: this.newHabit.reminderTime,
        tags: this.newHabit.tags
      };
      
      this.habitService.updateHabit(this.editingHabit.id, updateData).subscribe({
        next: () => {
          console.log('Activity updated successfully');
          this.closeModal();
          this.loadHabits();
        },
        error: (error) => {
          console.error('Error updating activity:', error);
          alert('Error updating activity. Please try again.');
        }
      });
    } else {
      // Create new habit
      this.habitService.createHabit(this.newHabit).subscribe({
        next: (habit) => {
          console.log('Activity created successfully:', habit);
          this.closeModal();
          this.loadHabits();
        },
        error: (error) => {
          console.error('Error creating activity:', error);
          alert('Error creating activity. Please try again.');
        }
      });
    }
  }

  closeModal(): void {
    this.showCreateForm = false;
    this.editingHabit = null;
    this.resetNewHabitForm();
  }

  resetNewHabitForm(): void {
    this.newHabit = {
      name: '',
      description: '',
      frequency: 'daily',
      targetCount: 1,
      category: 'Health & Fitness',
      color: '#4ade80',
      icon: '✅',
      difficulty: 'easy',
      points: 10,
      tags: []
    };
  }

  // Statistics view helpers
  getMaxCompletions(): number {
    if (!this.habitStats?.weeklyProgress.length) return 1;
    return Math.max(...this.habitStats.weeklyProgress.map(day => day.completions), 1);
  }

  formatChartDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}