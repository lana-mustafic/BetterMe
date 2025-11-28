import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CollaborationService } from '../../services/collaboration.service';
import { ShareTaskRequest, SharePermission, SharedTask } from '../../models/collaboration.model';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-share-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="close()">
        <div class="modal-content share-modal glass-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Share Task: {{ taskTitle }}</h3>
            <button class="close-btn" (click)="close()">×</button>
          </div>
          
          <div class="modal-body">
            <!-- User Search -->
            <div class="form-group">
              <label class="form-label">Search Users by Email or Name</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="searchQuery"
                (input)="searchUsers()"
                placeholder="Enter email or name..."
                [disabled]="isSharing"
              />
              @if (isSearching) {
                <div class="loading-text">Searching...</div>
              }
              @if (searchResults.length > 0) {
                <div class="user-results">
                  @for (user of searchResults; track user.id) {
                    <div class="user-item" (click)="selectUser(user)">
                      <div class="user-info">
                        <div class="user-name">{{ user.displayName || user.name }}</div>
                        <div class="user-email">{{ user.email }}</div>
                      </div>
                      @if (selectedUser?.id === user.id) {
                        <span class="check-icon">✓</span>
                      }
                    </div>
                  }
                </div>
              }
              @if (searchQuery && searchQuery.length >= 2 && !isSearching && searchResults.length === 0) {
                <div class="no-results">No users found</div>
              }
            </div>

            <!-- Permission Selection -->
            @if (selectedUser) {
              <div class="form-group">
                <label class="form-label">Permission Level</label>
                <div class="permission-options">
                  <label class="permission-option">
                    <input
                      type="radio"
                      [(ngModel)]="selectedPermission"
                      [value]="SharePermission.View"
                      name="permission"
                    />
                    <div class="permission-content">
                      <strong>View Only</strong>
                      <span>Can view the task but cannot edit</span>
                    </div>
                  </label>
                  <label class="permission-option">
                    <input
                      type="radio"
                      [(ngModel)]="selectedPermission"
                      [value]="SharePermission.Edit"
                      name="permission"
                    />
                    <div class="permission-content">
                      <strong>Can Edit</strong>
                      <span>Can view and edit the task</span>
                    </div>
                  </label>
                  <label class="permission-option">
                    <input
                      type="radio"
                      [(ngModel)]="selectedPermission"
                      [value]="SharePermission.Comment"
                      name="permission"
                    />
                    <div class="permission-content">
                      <strong>Can Comment</strong>
                      <span>Can view and add comments</span>
                    </div>
                  </label>
                </div>
              </div>
            }

            <!-- Current Shares -->
            @if (currentShares.length > 0) {
              <div class="form-group">
                <label class="form-label">Currently Shared With</label>
                <div class="shares-list">
                  @for (share of currentShares; track share.id) {
                    <div class="share-item">
                      <div class="share-info">
                        <div class="share-user-name">{{ share.sharedWithUserName }}</div>
                        <div class="share-permission">{{ getPermissionText(share.permission) }}</div>
                      </div>
                      <button
                        class="btn-icon-small"
                        (click)="removeShare(share.sharedWithUserId)"
                        [disabled]="isSharing"
                        title="Remove share"
                      >
                        🗑️
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            @if (errorMessage) {
              <div class="error-message">{{ errorMessage }}</div>
            }
          </div>

          <div class="modal-actions">
            <button class="btn btn-outline" (click)="close()" [disabled]="isSharing">Cancel</button>
            <button
              class="btn btn-gradient"
              (click)="shareTask()"
              [disabled]="!selectedUser || isSharing"
            >
              @if (isSharing) {
                Sharing...
              } @else {
                Share Task
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .share-modal {
      max-width: 600px;
      width: 90%;
    }

    .user-results {
      margin-top: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
    }

    .user-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-item:last-child {
      border-bottom: none;
    }

    .user-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
    }

    .user-email {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .check-icon {
      color: #4ade80;
      font-size: 1.2rem;
    }

    .permission-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .permission-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.05);
    }

    .permission-option:hover {
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.1);
    }

    .permission-option input[type="radio"] {
      margin-top: 0.25rem;
    }

    .permission-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .permission-content strong {
      color: white;
    }

    .permission-content span {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .shares-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .share-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .share-user-name {
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
    }

    .share-permission {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .no-results, .loading-text {
      margin-top: 0.5rem;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      text-align: center;
      padding: 0.5rem;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.75rem;
      border-radius: 8px;
      margin-top: 1rem;
    }
  `]
})
export class ShareTaskModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() taskId!: number;
  @Input() taskTitle = '';
  @Output() closed = new EventEmitter<void>();
  @Output() shared = new EventEmitter<void>();

  private collaborationService = inject(CollaborationService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  searchQuery = '';
  searchResults: any[] = [];
  selectedUser: any = null;
  selectedPermission: SharePermission = SharePermission.View;
  currentShares: SharedTask[] = [];
  isSearching = false;
  isSharing = false;
  errorMessage = '';
  SharePermission = SharePermission;

  ngOnInit() {
    if (this.taskId) {
      this.loadCurrentShares();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']?.currentValue && this.taskId) {
      this.loadCurrentShares();
      // Reset form when modal opens
      this.selectedUser = null;
      this.searchQuery = '';
      this.searchResults = [];
      this.errorMessage = '';
      this.selectedPermission = SharePermission.View;
    }
  }

  async searchUsers() {
    if (this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    this.errorMessage = '';

    try {
      // Use the correct API endpoint for user search (apiUrl already includes /api)
      const response = await this.http.get<any[]>(`${this.apiUrl}/users/search?query=${encodeURIComponent(this.searchQuery)}`).toPromise();
      this.searchResults = response || [];
      if (this.searchResults.length === 0 && this.searchQuery.length >= 2) {
        // Don't show error for no results, just empty list
      }
    } catch (error: any) {
      console.error('Error searching users:', error);
      this.errorMessage = 'Failed to search users. Please try again.';
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.errorMessage = '';
  }

  async shareTask() {
    if (!this.selectedUser || !this.taskId) {
      this.errorMessage = 'Please select a user to share with';
      return;
    }

    this.isSharing = true;
    this.errorMessage = '';

    try {
      const request: ShareTaskRequest = {
        taskId: this.taskId,
        sharedWithUserId: this.selectedUser.id,
        permission: this.selectedPermission
      };

      await this.collaborationService.shareTask(request).toPromise();
      this.shared.emit();
      await this.loadCurrentShares();
      this.selectedUser = null;
      this.searchQuery = '';
      this.searchResults = [];
      this.errorMessage = '';
    } catch (error: any) {
      console.error('Error sharing task:', error);
      this.errorMessage = error?.error?.message || error?.message || 'Failed to share task. Please try again.';
    } finally {
      this.isSharing = false;
    }
  }

  async removeShare(userId: number) {
    if (!confirm('Remove share with this user?')) return;

    try {
      await this.collaborationService.unshareTask(this.taskId, userId).toPromise();
      await this.loadCurrentShares();
      this.errorMessage = '';
    } catch (error: any) {
      console.error('Error removing share:', error);
      this.errorMessage = error?.error?.message || error?.message || 'Failed to remove share. Please try again.';
    }
  }

  async loadCurrentShares() {
    if (!this.taskId) return;
    try {
      this.currentShares = await this.collaborationService.getTaskShares(this.taskId).toPromise() || [];
    } catch (error) {
      console.error('Failed to load shares', error);
      this.currentShares = [];
    }
  }

  getPermissionText(permission: SharePermission): string {
    switch (permission) {
      case SharePermission.View: return 'View Only';
      case SharePermission.Edit: return 'Can Edit';
      case SharePermission.Comment: return 'Can Comment';
      default: return 'Unknown';
    }
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
    this.searchQuery = '';
    this.searchResults = [];
    this.selectedUser = null;
    this.errorMessage = '';
  }
}

