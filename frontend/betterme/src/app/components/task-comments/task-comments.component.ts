import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CollaborationService } from '../../services/collaboration.service';
import { TaskComment, CreateCommentRequest } from '../../models/collaboration.model';
import { AuthService, User } from '../../services/auth';

@Component({
  selector: 'app-task-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="comments-panel">
      <div class="comments-header">
        <h4>Comments ({{ comments.length }})</h4>
      </div>

      <!-- Add Comment Form -->
      <div class="comment-form">
        <textarea
          class="comment-input"
          [(ngModel)]="newComment"
          placeholder="Add a comment..."
          rows="3"
          [disabled]="isSubmitting"
        ></textarea>
        <div class="comment-actions">
          <button
            class="btn btn-gradient btn-sm"
            (click)="addComment()"
            [disabled]="!newComment.trim() || isSubmitting"
          >
            @if (isSubmitting) {
              Posting...
            } @else {
              Post Comment
            }
          </button>
        </div>
      </div>

      <!-- Comments List -->
      <div class="comments-list">
        @if (loading) {
          <div class="loading">Loading comments...</div>
        } @else if (comments.length === 0) {
          <div class="no-comments">No comments yet. Be the first to comment!</div>
        } @else {
          @for (comment of comments; track comment.id) {
            <div class="comment-item">
              <div class="comment-header">
                <div class="comment-author">
                  <div class="author-avatar">{{ getInitials(comment.userName) }}</div>
                  <div class="author-info">
                    <div class="author-name">{{ comment.userName }}</div>
                    <div class="comment-date">{{ formatDate(comment.createdAt) }}</div>
                  </div>
                </div>
                @if (canEditComment(comment)) {
                  <div class="comment-actions-menu">
                    @if (!editingCommentId || editingCommentId !== comment.id) {
                      <button class="btn-icon-small" (click)="startEdit(comment)" title="Edit">✏️</button>
                      <button class="btn-icon-small" (click)="deleteComment(comment.id)" title="Delete">🗑️</button>
                    }
                  </div>
                }
              </div>
              
              @if (editingCommentId === comment.id) {
                <div class="comment-edit">
                  <textarea
                    class="comment-input"
                    [(ngModel)]="editCommentText"
                    rows="3"
                  ></textarea>
                  <div class="edit-actions">
                    <button class="btn btn-sm btn-outline" (click)="cancelEdit()">Cancel</button>
                    <button class="btn btn-sm btn-gradient" (click)="saveEdit(comment.id)">Save</button>
                  </div>
                </div>
              } @else {
                <div class="comment-content">
                  {{ comment.content }}
                  @if (comment.isEdited) {
                    <span class="edited-badge">(edited)</span>
                  }
                </div>
              }

              <!-- Replies -->
              @if (comment.replies && comment.replies.length > 0) {
                <div class="replies">
                  @for (reply of comment.replies; track reply.id) {
                    <div class="comment-item reply-item">
                      <div class="comment-header">
                        <div class="comment-author">
                          <div class="author-avatar small">{{ getInitials(reply.userName) }}</div>
                          <div class="author-info">
                            <div class="author-name">{{ reply.userName }}</div>
                            <div class="comment-date">{{ formatDate(reply.createdAt) }}</div>
                          </div>
                        </div>
                        @if (canEditComment(reply)) {
                          <button class="btn-icon-small" (click)="deleteComment(reply.id)" title="Delete">🗑️</button>
                        }
                      </div>
                      <div class="comment-content">
                        {{ reply.content }}
                        @if (reply.isEdited) {
                          <span class="edited-badge">(edited)</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .comments-panel {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .comments-header {
      margin-bottom: 1rem;
    }

    .comments-header h4 {
      color: white;
      margin: 0;
      font-size: 1.1rem;
    }

    .comment-form {
      margin-bottom: 1.5rem;
    }

    .comment-input {
      width: 100%;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 0.5rem;
    }

    .comment-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .comment-input:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.4);
    }

    .comment-actions {
      display: flex;
      justify-content: flex-end;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .comment-item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .reply-item {
      margin-left: 2rem;
      margin-top: 0.5rem;
      background: rgba(255, 255, 255, 0.03);
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .comment-author {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .author-avatar.small {
      width: 32px;
      height: 32px;
      font-size: 0.8rem;
    }

    .author-name {
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
    }

    .comment-date {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .comment-content {
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .edited-badge {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
      font-style: italic;
      margin-left: 0.5rem;
    }

    .comment-actions-menu {
      display: flex;
      gap: 0.5rem;
    }

    .comment-edit {
      margin-top: 0.5rem;
    }

    .edit-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }

    .replies {
      margin-top: 1rem;
      padding-left: 1rem;
      border-left: 2px solid rgba(255, 255, 255, 0.1);
    }

    .loading, .no-comments {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .btn-icon-small {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-icon-small:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  `]
})
export class TaskCommentsComponent implements OnInit, OnChanges {
  @Input() taskId!: number;
  @Output() commentAdded = new EventEmitter<void>();

  private collaborationService = inject(CollaborationService);
  private authService = inject(AuthService);

  comments: TaskComment[] = [];
  newComment = '';
  loading = false;
  isSubmitting = false;
  editingCommentId: number | null = null;
  editCommentText = '';
  currentUser: User | null = null;

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.taskId) {
      this.loadComments();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskId'] && this.taskId) {
      this.loadComments();
    }
  }

  async loadComments() {
    if (!this.taskId) return;

    this.loading = true;
    try {
      this.comments = await firstValueFrom(this.collaborationService.getComments(this.taskId));
    } catch (error) {
      console.error('Failed to load comments', error);
      this.comments = [];
    } finally {
      this.loading = false;
    }
  }

  async addComment() {
    if (!this.newComment.trim() || !this.taskId) return;

    this.isSubmitting = true;
    try {
      const request: CreateCommentRequest = {
        content: this.newComment.trim()
      };
      await firstValueFrom(this.collaborationService.createComment(this.taskId, request));
      this.newComment = '';
      await this.loadComments();
      this.commentAdded.emit();
    } catch (error) {
      console.error('Failed to add comment', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  startEdit(comment: TaskComment) {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.content;
  }

  cancelEdit() {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  async saveEdit(commentId: number) {
    if (!this.editCommentText.trim()) return;

    try {
      await firstValueFrom(this.collaborationService.updateComment(commentId, this.editCommentText.trim()));
      this.editingCommentId = null;
      this.editCommentText = '';
      await this.loadComments();
    } catch (error) {
      console.error('Failed to update comment', error);
      alert('Failed to update comment. Please try again.');
    }
  }

  async deleteComment(commentId: number) {
    if (!confirm('Delete this comment?')) return;

    try {
      await firstValueFrom(this.collaborationService.deleteComment(commentId));
      await this.loadComments();
      this.commentAdded.emit();
    } catch (error) {
      console.error('Failed to delete comment', error);
      alert('Failed to delete comment. Please try again.');
    }
  }

  canEditComment(comment: TaskComment): boolean {
    return this.currentUser?.id === comment.userId;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

