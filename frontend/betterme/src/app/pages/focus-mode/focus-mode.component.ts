import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FocusService, FocusSession, PomodoroSettings } from '../../services/focus.service';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type TimerState = 'idle' | 'running' | 'paused' | 'completed';
type SessionType = 'work' | 'break';

@Component({
  selector: 'app-focus-mode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="focus-mode-page" [class.focus-active]="isFocusMode">
      <!-- Background Animation -->
      <div class="background-animation">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
      </div>

      <div class="container">
        <!-- Header -->
        <div class="focus-header">
          <h1 class="gradient-text">Focus Mode</h1>
          <p class="subtitle">Stay focused, get things done</p>
        </div>

        <!-- Main Timer Section -->
        <div class="timer-container glass-card">
          <!-- Task Selection -->
          @if (timerState === 'idle' || timerState === 'paused') {
            <div class="task-selection">
              <label class="label">Select a task to focus on (optional)</label>
              <select 
                class="task-select" 
                [(ngModel)]="selectedTaskId"
                (change)="onTaskChange()"
              >
                <option [value]="null">No task selected</option>
                @for (task of availableTasks; track task.id) {
                  <option [value]="task.id">{{ task.title }}</option>
                }
              </select>
              @if (selectedTask) {
                <div class="selected-task-info">
                  <span class="task-title">{{ selectedTask.title }}</span>
                  @if (selectedTask.description) {
                    <p class="task-description">{{ selectedTask.description }}</p>
                  }
                </div>
              }
            </div>
          }

          <!-- Current Task Display (during session) -->
          @if (activeSession && activeSession.taskTitle) {
            <div class="current-task-display">
              <span class="label">Focusing on:</span>
              <span class="task-title">{{ activeSession.taskTitle }}</span>
            </div>
          }

          <!-- Timer Circle -->
          <div class="timer-circle-wrapper">
            <div class="timer-circle" [class.work]="currentSessionType === 'work'" [class.break]="currentSessionType === 'break'">
              <svg class="timer-svg" viewBox="0 0 200 200">
                <circle
                  class="timer-background"
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  stroke-width="8"
                />
                <circle
                  class="timer-progress"
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  [attr.stroke]="currentSessionType === 'work' ? '#4ade80' : '#60a5fa'"
                  stroke-width="8"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="circumference"
                  [attr.stroke-dashoffset]="progressOffset"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div class="timer-content">
                <div class="timer-time">{{ formattedTime }}</div>
                <div class="timer-label">{{ currentSessionType === 'work' ? 'Focus Time' : 'Break Time' }}</div>
                @if (pomodoroCount > 0) {
                  <div class="pomodoro-count">Pomodoro {{ pomodoroCount }}</div>
                }
              </div>
            </div>
          </div>

          <!-- Timer Controls -->
          <div class="timer-controls">
            @if (timerState === 'idle') {
              <button class="btn btn-gradient btn-large" (click)="startTimer()">
                <span class="btn-icon">▶</span>
                Start Focus
              </button>
            }
            @if (timerState === 'running') {
              <button class="btn btn-outline" (click)="pauseTimer()">
                <span class="btn-icon">⏸</span>
                Pause
              </button>
              <button class="btn btn-danger" (click)="stopTimer()">
                <span class="btn-icon">⏹</span>
                Stop
              </button>
            }
            @if (timerState === 'paused') {
              <button class="btn btn-gradient" (click)="resumeTimer()">
                <span class="btn-icon">▶</span>
                Resume
              </button>
              <button class="btn btn-danger" (click)="stopTimer()">
                <span class="btn-icon">⏹</span>
                Stop
              </button>
            }
            @if (timerState === 'completed') {
              <button class="btn btn-gradient" (click)="startBreak()">
                <span class="btn-icon">☕</span>
                Take Break
              </button>
              <button class="btn btn-outline" (click)="resetTimer()">
                <span class="btn-icon">🔄</span>
                Reset
              </button>
            }
          </div>

          <!-- Session Stats -->
          @if (activeSession) {
            <div class="session-stats">
              <div class="stat-item">
                <span class="stat-label">Session Type:</span>
                <span class="stat-value">{{ activeSession.sessionType === 'work' ? 'Work' : 'Break' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Duration:</span>
                <span class="stat-value">{{ activeSession.durationMinutes }} min</span>
              </div>
            </div>
          }
        </div>

        <!-- Settings & Stats Toggle -->
        <div class="actions-bar">
          <button class="btn btn-outline" (click)="showSettings = !showSettings">
            <span class="btn-icon">⚙️</span>
            Settings
          </button>
          <button class="btn btn-outline" (click)="showStats = !showStats">
            <span class="btn-icon">📊</span>
            Statistics
          </button>
          <button class="btn btn-outline" (click)="toggleFocusMode()">
            <span class="btn-icon">{{ isFocusMode ? '👁️' : '🔒' }}</span>
            {{ isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode' }}
          </button>
        </div>

        <!-- Settings Panel -->
        @if (showSettings) {
          <div class="settings-panel glass-card">
            <h3>Pomodoro Settings</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <label>Work Duration (minutes)</label>
                <input type="number" [(ngModel)]="settings.workDurationMinutes" min="1" max="60" />
              </div>
              <div class="setting-item">
                <label>Short Break (minutes)</label>
                <input type="number" [(ngModel)]="settings.shortBreakMinutes" min="1" max="30" />
              </div>
              <div class="setting-item">
                <label>Long Break (minutes)</label>
                <input type="number" [(ngModel)]="settings.longBreakMinutes" min="1" max="60" />
              </div>
              <div class="setting-item">
                <label>Sessions Until Long Break</label>
                <input type="number" [(ngModel)]="settings.sessionsUntilLongBreak" min="2" max="10" />
              </div>
              <div class="setting-item checkbox">
                <label>
                  <input type="checkbox" [(ngModel)]="settings.autoStartBreaks" />
                  Auto-start breaks
                </label>
              </div>
              <div class="setting-item checkbox">
                <label>
                  <input type="checkbox" [(ngModel)]="settings.autoStartPomodoros" />
                  Auto-start pomodoros
                </label>
              </div>
              <div class="setting-item checkbox">
                <label>
                  <input type="checkbox" [(ngModel)]="settings.playSoundOnComplete" />
                  Play sound when complete
                </label>
              </div>
              <div class="setting-item checkbox">
                <label>
                  <input type="checkbox" [(ngModel)]="settings.showNotifications" />
                  Show notifications
                </label>
              </div>
            </div>
            <button class="btn btn-gradient" (click)="saveSettings()">Save Settings</button>
          </div>
        }

        <!-- Statistics Panel -->
        @if (showStats) {
          <div class="stats-panel glass-card">
            <h3>Your Focus Statistics</h3>
            @if (loadingStats) {
              <p>Loading statistics...</p>
            } @else if (stats) {
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">{{ stats.totalSessions }}</div>
                  <div class="stat-label">Total Sessions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ stats.completedSessions }}</div>
                  <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ formatMinutes(stats.totalFocusMinutes) }}</div>
                  <div class="stat-label">Total Focus Time</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ stats.averageSessionDuration }} min</div>
                  <div class="stat-label">Avg Session</div>
                </div>
              </div>
              @if (hasTaskStats()) {
                <div class="task-stats">
                  <h4>Focus by Task</h4>
                  @for (entry of getTaskStatsEntries(); track entry.task) {
                    <div class="task-stat-item">
                      <span class="task-name">{{ entry.task }}</span>
                      <span class="task-count">{{ entry.count }} sessions</span>
                    </div>
                  }
                </div>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .focus-mode-page {
      min-height: 100vh;
      background: var(--bg-gradient);
      position: relative;
      padding: 2rem 1rem;
      transition: all 0.3s ease;
    }

    .focus-mode-page.focus-active {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    body.dark-mode .focus-mode-page.focus-active {
      background: linear-gradient(135deg, #0a0a1a 0%, #0d1321 100%);
    }

    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    }

    .floating-shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 20s infinite ease-in-out;
      transition: background 0.3s ease;
    }

    body.dark-mode .floating-shape {
      background: rgba(255, 255, 255, 0.05);
    }

    .shape-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 10%;
      animation-delay: 5s;
    }

    .shape-3 {
      width: 100px;
      height: 100px;
      bottom: 20%;
      left: 50%;
      animation-delay: 10s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .focus-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .focus-header h1 {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.2rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    body.dark-mode .glass-card {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .task-selection {
      margin-bottom: 2rem;
    }

    .label {
      display: block;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .task-select {
      width: 100%;
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    body.dark-mode .task-select {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .task-select:focus {
      background: rgba(35, 35, 35, 0.5);
      border-color: rgba(102, 126, 234, 0.6);
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    .task-select option {
      background: #1a1a2e;
      color: white;
    }

    body.dark-mode .task-select option {
      background: rgba(26, 26, 26, 0.95) !important;
      color: rgba(255, 255, 255, 0.9) !important;
    }

    body.dark-mode .task-select option:checked {
      background: rgba(102, 126, 234, 0.6) !important;
      color: rgba(255, 255, 255, 0.95) !important;
    }

    .selected-task-info {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      margin-top: 1rem;
    }

    body.dark-mode .selected-task-info {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .task-title {
      font-weight: 600;
      color: white;
      display: block;
      margin-bottom: 0.5rem;
    }

    body.dark-mode .task-title {
      color: rgba(255, 255, 255, 0.95);
    }

    .task-description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      margin: 0;
    }

    body.dark-mode .task-description {
      color: rgba(255, 255, 255, 0.6);
    }

    .current-task-display {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }

    body.dark-mode .current-task-display {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .timer-container {
      text-align: center;
    }

    .timer-circle-wrapper {
      display: flex;
      justify-content: center;
      margin: 2rem 0;
    }

    .timer-circle {
      position: relative;
      width: 300px;
      height: 300px;
    }

    .timer-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .timer-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .timer-time {
      font-size: 3.5rem;
      font-weight: bold;
      color: white;
      margin-bottom: 0.5rem;
      font-variant-numeric: tabular-nums;
    }

    body.dark-mode .timer-time {
      color: rgba(255, 255, 255, 0.95);
    }

    .timer-label {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    body.dark-mode .timer-label {
      color: rgba(255, 255, 255, 0.7);
    }

    .pomodoro-count {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 0.5rem;
    }

    body.dark-mode .pomodoro-count {
      color: rgba(255, 255, 255, 0.5);
    }

    .timer-circle.work .timer-progress {
      stroke: #4ade80;
    }

    .timer-circle.break .timer-progress {
      stroke: #60a5fa;
    }

    .timer-controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    body.dark-mode .btn-gradient {
      background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
      box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5);
    }

    .btn-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    body.dark-mode .btn-gradient:hover {
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      box-shadow: 0 8px 25px rgba(5, 150, 105, 0.7);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    body.dark-mode .btn-outline {
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .btn-outline:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    body.dark-mode .btn-danger {
      background: rgba(239, 68, 68, 0.8);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    body.dark-mode .btn-danger:hover {
      background: rgba(220, 38, 38, 0.9);
    }

    .btn-large {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    .session-stats {
      display: flex;
      gap: 2rem;
      justify-content: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    body.dark-mode .session-stats {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    body.dark-mode .stat-label {
      color: rgba(255, 255, 255, 0.6);
    }

    .stat-value {
      font-size: 1.2rem;
      font-weight: 600;
      color: white;
    }

    body.dark-mode .stat-value {
      color: rgba(255, 255, 255, 0.95);
    }

    .actions-bar {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .settings-panel, .stats-panel {
      margin-top: 1.5rem;
    }

    .settings-panel h3, .stats-panel h3 {
      color: white;
      margin-bottom: 1.5rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .setting-item label {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }

    .setting-item input[type="number"] {
      padding: 0.5rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
    }

    body.dark-mode .setting-item input[type="number"] {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .setting-item input[type="number"]:focus {
      background: rgba(26, 26, 26, 0.5);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .setting-item.checkbox {
      flex-direction: row;
      align-items: center;
    }

    .setting-item.checkbox input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-right: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      border-radius: 10px;
      text-align: center;
    }

    body.dark-mode .stat-card {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-card .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: white;
      margin-bottom: 0.5rem;
    }

    .stat-card .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .task-stats {
      margin-top: 2rem;
    }

    .task-stats h4 {
      color: white;
      margin-bottom: 1rem;
    }

    .task-stat-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    body.dark-mode .task-stat-item {
      background: rgba(26, 26, 26, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .task-name {
      color: white;
      font-weight: 500;
    }

    .task-count {
      color: rgba(255, 255, 255, 0.7);
    }

    .gradient-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

    /* ============================================
       COMPREHENSIVE DARK MODE STYLES
       ============================================ */

    /* Timer Container Dark Mode */
    body.dark-mode .timer-container.glass-card {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    /* Task Selection Dark Mode */
    body.dark-mode .task-selection {
      background: transparent;
    }

    body.dark-mode .label {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Settings Panel Dark Mode */
    body.dark-mode .settings-panel {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .settings-panel h3 {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .setting-item label {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .setting-item input[type="checkbox"] {
      accent-color: rgba(102, 126, 234, 0.8);
    }

    /* Stats Panel Dark Mode */
    body.dark-mode .stats-panel {
      background: rgba(26, 26, 26, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .stats-panel h3 {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .task-stats h4 {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .task-name {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark-mode .task-count {
      color: rgba(255, 255, 255, 0.7);
    }

    /* Timer Circle Dark Mode */
    body.dark-mode .timer-background {
      stroke: rgba(255, 255, 255, 0.08);
    }

    /* Actions Bar Dark Mode */
    body.dark-mode .actions-bar {
      background: transparent;
    }

    /* Settings Grid Dark Mode */
    body.dark-mode .settings-grid {
      background: transparent;
    }

    /* Stats Grid Dark Mode */
    body.dark-mode .stats-grid {
      background: transparent;
    }

    /* Task Stats Dark Mode */
    body.dark-mode .task-stats {
      background: transparent;
    }

    /* Current Task Display Dark Mode */
    body.dark-mode .current-task-display .label {
      color: rgba(255, 255, 255, 0.8);
    }

    /* Timer Controls Dark Mode */
    body.dark-mode .timer-controls {
      background: transparent;
    }

    /* Timer Circle Wrapper Dark Mode */
    body.dark-mode .timer-circle-wrapper {
      background: transparent;
    }

    /* Session Stats - already has dark mode but ensure consistency */
    body.dark-mode .session-stats .stat-item {
      background: transparent;
    }

    /* Stat Card Dark Mode - additional styling */
    body.dark-mode .stat-card .stat-value {
      color: rgba(255, 255, 255, 0.95);
    }

    body.dark-mode .stat-card .stat-label {
      color: rgba(255, 255, 255, 0.7);
    }

    /* Subtitle Dark Mode */
    body.dark-mode .subtitle {
      color: rgba(255, 255, 255, 0.8);
    }

    /* Focus Header Dark Mode */
    body.dark-mode .focus-header {
      background: transparent;
    }

    /* Container Dark Mode */
    body.dark-mode .container {
      background: transparent;
    }

    /* Loading Stats Dark Mode */
    body.dark-mode .stats-panel p {
      color: rgba(255, 255, 255, 0.7);
    }

    /* ============================================
       END DARK MODE STYLES
       ============================================ */

    @media (max-width: 768px) {
      .timer-circle {
        width: 250px;
        height: 250px;
      }

      .timer-time {
        font-size: 2.5rem;
      }

      .focus-header h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class FocusModeComponent implements OnInit, OnDestroy {
  private focusService = inject(FocusService);
  private taskService = inject(TaskService);
  private destroy$ = new Subject<void>();
  private timerSubscription?: Subscription;

  // Timer state
  timerState: TimerState = 'idle';
  currentSessionType: SessionType = 'work';
  timeRemaining: number = 25 * 60; // seconds
  totalDuration: number = 25 * 60; // seconds
  pomodoroCount: number = 0;
  
  // UI state
  showSettings: boolean = false;
  showStats: boolean = false;
  isFocusMode: boolean = false;
  loadingStats: boolean = false;

  // Data
  activeSession: FocusSession | null = null;
  availableTasks: Task[] = [];
  selectedTaskId: number | null = null;
  selectedTask: Task | null = null;
  settings: PomodoroSettings = {
    workDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    playSoundOnComplete: true,
    showNotifications: true
  };
  stats: any = null;

  // Timer calculations
  get circumference(): number {
    return 2 * Math.PI * 90; // radius = 90
  }

  get progressOffset(): number {
    const progress = this.timeRemaining / this.totalDuration;
    return this.circumference * (1 - progress);
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    this.loadSettings();
    this.loadTasks();
    this.checkActiveSession();
    this.loadStats();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerState === 'running') {
      this.pauseTimer();
    }
    document.body.style.overflow = '';
  }

  loadSettings(): void {
    this.focusService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.timeRemaining = settings.workDurationMinutes * 60;
        this.totalDuration = settings.workDurationMinutes * 60;
      },
      error: (err) => {
        console.error('Failed to load settings:', err);
      }
    });
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.availableTasks = tasks.filter(t => !t.completed);
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
      }
    });
  }

  checkActiveSession(): void {
    this.focusService.getActiveSession().subscribe({
      next: (session) => {
        if (session) {
          this.activeSession = session;
          this.currentSessionType = session.sessionType as SessionType;
          this.selectedTaskId = session.taskId || null;
          
          // Calculate remaining time
          const startedAt = new Date(session.startedAt);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          this.totalDuration = session.durationMinutes * 60;
          this.timeRemaining = Math.max(0, this.totalDuration - elapsed);
          
          if (this.timeRemaining > 0) {
            this.timerState = 'running';
            this.startTimerInterval();
          } else {
            this.completeSession();
          }
        }
      },
      error: () => {
        // No active session
        this.activeSession = null;
      }
    });
  }

  onTaskChange(): void {
    if (this.selectedTaskId) {
      this.selectedTask = this.availableTasks.find(t => t.id === this.selectedTaskId) || null;
    } else {
      this.selectedTask = null;
    }
  }

  startTimer(): void {
    const duration = this.currentSessionType === 'work' 
      ? this.settings.workDurationMinutes 
      : this.settings.shortBreakMinutes;

    this.focusService.startSession({
      taskId: this.selectedTaskId || undefined,
      sessionType: this.currentSessionType,
      durationMinutes: duration
    }).subscribe({
      next: (session) => {
        this.activeSession = session;
        this.currentSessionType = session.sessionType as SessionType;
        this.totalDuration = session.durationMinutes * 60;
        this.timeRemaining = this.totalDuration;
        this.timerState = 'running';
        if (this.currentSessionType === 'work') {
          this.pomodoroCount++;
        }
        this.startTimerInterval();
      },
      error: (err) => {
        console.error('Failed to start session:', err);
        alert('Failed to start focus session. Please try again.');
      }
    });
  }

  pauseTimer(): void {
    this.timerState = 'paused';
  }

  resumeTimer(): void {
    this.timerState = 'running';
    this.startTimerInterval();
  }

  stopTimer(): void {
    if (this.activeSession) {
      this.focusService.completeSession(this.activeSession.id, true).subscribe({
        next: () => {
          this.resetTimer();
        },
        error: (err) => {
          console.error('Failed to stop session:', err);
        }
      });
    } else {
      this.resetTimer();
    }
  }

  completeSession(): void {
    if (this.activeSession) {
      this.focusService.completeSession(this.activeSession.id, false).subscribe({
        next: () => {
          this.timerState = 'completed';
          this.activeSession = null;
          if (this.settings.playSoundOnComplete) {
            this.playCompletionSound();
          }
          if (this.settings.showNotifications) {
            this.showNotification();
          }
        },
        error: (err) => {
          console.error('Failed to complete session:', err);
        }
      });
    }
  }

  startBreak(): void {
    this.currentSessionType = 'break';
    const isLongBreak = this.pomodoroCount % this.settings.sessionsUntilLongBreak === 0;
    const breakDuration = isLongBreak ? this.settings.longBreakMinutes : this.settings.shortBreakMinutes;
    
    this.totalDuration = breakDuration * 60;
    this.timeRemaining = this.totalDuration;
    this.timerState = 'running';
    this.startTimer();
  }

  resetTimer(): void {
    this.timerState = 'idle';
    this.currentSessionType = 'work';
    this.timeRemaining = this.settings.workDurationMinutes * 60;
    this.totalDuration = this.settings.workDurationMinutes * 60;
    this.activeSession = null;
    this.pomodoroCount = 0;
  }

  startTimerInterval(): void {
    // Clear existing subscription if any
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    this.timerSubscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.timerState === 'running') {
          this.timeRemaining--;
          if (this.timeRemaining <= 0) {
            this.completeSession();
          }
        }
      });
  }

  saveSettings(): void {
    this.focusService.updateSettings(this.settings).subscribe({
      next: () => {
        alert('Settings saved successfully!');
        this.showSettings = false;
        this.timeRemaining = this.settings.workDurationMinutes * 60;
        this.totalDuration = this.settings.workDurationMinutes * 60;
      },
      error: (err) => {
        console.error('Failed to save settings:', err);
        alert('Failed to save settings. Please try again.');
      }
    });
  }

  loadStats(): void {
    this.loadingStats = true;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    this.focusService.getStats(startDate, endDate).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loadingStats = false;
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
        this.loadingStats = false;
      }
    });
  }

  getTaskStatsEntries(): Array<{ task: string; count: number }> {
    if (!this.stats?.sessionsByTask) return [];
    return Object.entries(this.stats.sessionsByTask).map(([task, count]) => ({
      task,
      count: count as number
    }));
  }

  hasTaskStats(): boolean {
    return !!(this.stats?.sessionsByTask && Object.keys(this.stats.sessionsByTask).length > 0);
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  toggleFocusMode(): void {
    this.isFocusMode = !this.isFocusMode;
    if (this.isFocusMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  playCompletionSound(): void {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  showNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Session Complete!', {
        body: this.currentSessionType === 'work' 
          ? 'Great job! Time for a break.' 
          : 'Break time is over. Ready to focus?',
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification();
        }
      });
    }
  }
}

