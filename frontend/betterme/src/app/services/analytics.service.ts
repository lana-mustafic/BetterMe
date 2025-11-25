import { Injectable, inject } from '@angular/core';
import { TaskService } from './task.service';
import { Observable, map } from 'rxjs';
import { Task } from '../models/task.model';

export interface CompletionTrend {
  date: string;
  completed: number;
  created: number;
  total: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  completed: number;
  percentage: number;
  color: string;
}

export interface PriorityDistribution {
  priority: number;
  name: string;
  count: number;
  completed: number;
  percentage: number;
  color: string;
}

export interface ProductivityMetrics {
  averageCompletionTime: number;
  tasksPerDay: number;
  completionRate: number;
  streak: number;
  bestDay: string;
  peakHours: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private taskService = inject(TaskService);

  // Get completion trends over time
  getCompletionTrends(days: number = 30): Observable<CompletionTrend[]> {
    return this.taskService.getTasks().pipe(
      map(tasks => {
        const trends: { [key: string]: CompletionTrend } = {};
        const today = new Date();
        
        // Initialize last N days
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          trends[dateKey] = {
            date: dateKey,
            completed: 0,
            created: 0,
            total: 0
          };
        }

        // Process tasks
        tasks.forEach(task => {
          // Track creation date
          if (task.createdAt) {
            const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
            if (trends[createdDate]) {
              trends[createdDate].created++;
              trends[createdDate].total++;
            }
          }

          // Track completion date
          if (task.completed && task.completedAt) {
            const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
            if (trends[completedDate]) {
              trends[completedDate].completed++;
            }
          }
        });

        return Object.values(trends);
      })
    );
  }

  // Get category distribution with completion rates
  getCategoryDistribution(): Observable<CategoryDistribution[]> {
    return this.taskService.getTasks().pipe(
      map(tasks => {
        const distribution: { [key: string]: { count: number; completed: number } } = {};
        const colors = [
          '#667eea', '#764ba2', '#f093fb', '#4facfe', 
          '#43e97b', '#fa709a', '#ffecd2', '#fcb69f'
        ];

        tasks.forEach(task => {
          const category = task.category || 'Uncategorized';
          if (!distribution[category]) {
            distribution[category] = { count: 0, completed: 0 };
          }
          distribution[category].count++;
          if (task.completed) {
            distribution[category].completed++;
          }
        });

        const total = tasks.length;
        let colorIndex = 0;

        return Object.entries(distribution)
          .map(([category, data]) => ({
            category,
            count: data.count,
            completed: data.completed,
            percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
            color: colors[colorIndex++ % colors.length]
          }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  // Get priority distribution
  getPriorityDistribution(): Observable<PriorityDistribution[]> {
    return this.taskService.getTasks().pipe(
      map(tasks => {
        const distribution: { [key: number]: { count: number; completed: number } } = {
          1: { count: 0, completed: 0 },
          2: { count: 0, completed: 0 },
          3: { count: 0, completed: 0 }
        };

        const priorityNames = { 1: 'Low', 2: 'Medium', 3: 'High' };
        const priorityColors = { 1: '#95a5a6', 2: '#f39c12', 3: '#e74c3c' };

        tasks.forEach(task => {
          distribution[task.priority].count++;
          if (task.completed) {
            distribution[task.priority].completed++;
          }
        });

        const total = tasks.length;

        return [1, 2, 3].map(priority => ({
          priority,
          name: priorityNames[priority as keyof typeof priorityNames],
          count: distribution[priority].count,
          completed: distribution[priority].completed,
          percentage: total > 0 ? Math.round((distribution[priority].count / total) * 100) : 0,
          color: priorityColors[priority as keyof typeof priorityColors]
        }));
      })
    );
  }

  // Get productivity metrics
  getProductivityMetrics(): Observable<ProductivityMetrics> {
    return this.taskService.getTasks().pipe(
      map(tasks => {
        const completedTasks = tasks.filter(t => t.completed && t.completedAt);
        
        // Calculate average completion time (mock for now, would need createdAt and completedAt)
        const averageCompletionTime = completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => {
              if (task.createdAt && task.completedAt) {
                const created = new Date(task.createdAt).getTime();
                const completed = new Date(task.completedAt).getTime();
                return sum + (completed - created) / (1000 * 60 * 60); // hours
              }
              return sum;
            }, 0) / completedTasks.length
          : 0;

        // Tasks per day (last 7 days)
        const last7Days = tasks.filter(task => {
          if (!task.createdAt) return false;
          const created = new Date(task.createdAt);
          const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        }).length;

        const completionRate = tasks.length > 0 
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0;

        // Calculate best day (day with most completions)
        const dayCompletions: { [key: string]: number } = {};
        completedTasks.forEach(task => {
          if (task.completedAt) {
            const day = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
            dayCompletions[day] = (dayCompletions[day] || 0) + 1;
          }
        });

        const bestDay = Object.entries(dayCompletions)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Peak hours (hours with most completions)
        const hourCompletions: { [key: number]: number } = {};
        completedTasks.forEach(task => {
          if (task.completedAt) {
            const hour = new Date(task.completedAt).getHours();
            hourCompletions[hour] = (hourCompletions[hour] || 0) + 1;
          }
        });

        const peakHours = Object.entries(hourCompletions)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([hour]) => parseInt(hour));

        // Calculate streak (consecutive days with completions)
        const completionDates = completedTasks
          .map(t => t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : null)
          .filter(d => d !== null)
          .sort()
          .reverse();

        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let currentDate = today;

        for (const date of completionDates) {
          if (date === currentDate) {
            streak++;
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            currentDate = prevDate.toISOString().split('T')[0];
          } else {
            break;
          }
        }

        return {
          averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
          tasksPerDay: Math.round((last7Days / 7) * 10) / 10,
          completionRate,
          streak,
          bestDay,
          peakHours
        };
      })
    );
  }

  // Get weekly completion data
  getWeeklyCompletion(): Observable<{ day: string; completed: number; created: number }[]> {
    return this.taskService.getTasks().pipe(
      map(tasks => {
        const weekData: { [key: string]: { completed: number; created: number } } = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Initialize all days
        days.forEach(day => {
          weekData[day] = { completed: 0, created: 0 };
        });

        tasks.forEach(task => {
          // Track creation day
          if (task.createdAt) {
            const day = new Date(task.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
            if (weekData[day]) {
              weekData[day].created++;
            }
          }

          // Track completion day
          if (task.completed && task.completedAt) {
            const day = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
            if (weekData[day]) {
              weekData[day].completed++;
            }
          }
        });

        return days.map(day => ({
          day,
          completed: weekData[day].completed,
          created: weekData[day].created
        }));
      })
    );
  }
}

