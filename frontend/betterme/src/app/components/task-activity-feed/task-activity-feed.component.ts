import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollaborationService } from '../../services/collaboration.service';
import { TaskActivity, ActivityType } from '../../models/collaboration.model';

@Component({
  selector: 'app-task-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-feed">
      <div class="activity-header">
        <h4>Activity</h4>
      </div>

      <div class="activity-list">
        @if (loading) {
          <div class="loading">Loading activity...</div>
        } @else if (activities.length === 0) {
          <div class="no-activity">No activity yet</div>
        } @else {
          @for (activity of activities; track activity.id) {
            <div class="activity-item">
              <div class="activity-icon">{{ getActivityIcon(activity.activityType) }}</div>
              <div class="activity-content">
                <div class="activity-text">
                  <strong>{{ activity.userName }}</strong>
                  {{ getActivityDescription(activity) }}
                </div>
                <div class="activity-date">{{ formatDate(activity.createdAt) }}</div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .activity-feed {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-header h4 {
      color: white;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      border-left: 3px solid transparent;
    }

    .activity-item:nth-child(odd) {
      border-left-color: #4ade80;
    }

    .activity-item:nth-child(even) {
      border-left-color: #22d3ee;
    }

    .activity-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0.25rem;
      line-height: 1.5;
    }

    .activity-text strong {
      color: white;
    }

    .activity-date {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .loading, .no-activity {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.6);
    }
  `]
})
export class TaskActivityFeedComponent implements OnInit, OnChanges {
  @Input() taskId!: number;

  private collaborationService = inject(CollaborationService);

  activities: TaskActivity[] = [];
  loading = false;

  ngOnInit() {
    if (this.taskId) {
      this.loadActivities();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskId'] && this.taskId) {
      this.loadActivities();
    }
  }

  async loadActivities() {
    if (!this.taskId) return;

    this.loading = true;
    try {
      this.activities = await this.collaborationService.getActivities(this.taskId).toPromise() || [];
    } catch (error) {
      console.error('Failed to load activities', error);
    } finally {
      this.loading = false;
    }
  }

  getActivityIcon(activityType: ActivityType): string {
    switch (activityType) {
      case ActivityType.Created: return '✨';
      case ActivityType.Updated: return '✏️';
      case ActivityType.Completed: return '✅';
      case ActivityType.Uncompleted: return '↩️';
      case ActivityType.Assigned: return '👤';
      case ActivityType.Unassigned: return '🚫';
      case ActivityType.Shared: return '🔗';
      case ActivityType.Unshared: return '🔓';
      case ActivityType.CommentAdded: return '💬';
      case ActivityType.CommentEdited: return '✏️';
      case ActivityType.CommentDeleted: return '🗑️';
      case ActivityType.AttachmentAdded: return '📎';
      case ActivityType.AttachmentDeleted: return '🗑️';
      default: return '📝';
    }
  }

  getActivityDescription(activity: TaskActivity): string {
    if (activity.description) {
      return activity.description;
    }

    switch (activity.activityType) {
      case ActivityType.Created:
        return 'created this task';
      case ActivityType.Updated:
        return 'updated this task';
      case ActivityType.Completed:
        return 'completed this task';
      case ActivityType.Uncompleted:
        return 'uncompleted this task';
      case ActivityType.Assigned:
        return activity.relatedUserName 
          ? `assigned this task to ${activity.relatedUserName}`
          : 'assigned this task';
      case ActivityType.Unassigned:
        return 'unassigned this task';
      case ActivityType.Shared:
        return activity.relatedUserName
          ? `shared this task with ${activity.relatedUserName}`
          : 'shared this task';
      case ActivityType.Unshared:
        return 'unshared this task';
      case ActivityType.CommentAdded:
        return 'added a comment';
      case ActivityType.CommentEdited:
        return 'edited a comment';
      case ActivityType.CommentDeleted:
        return 'deleted a comment';
      case ActivityType.AttachmentAdded:
        return 'added an attachment';
      case ActivityType.AttachmentDeleted:
        return 'deleted an attachment';
      default:
        return 'performed an action';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}

