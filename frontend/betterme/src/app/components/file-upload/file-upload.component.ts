import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

export interface Attachment {
  id: number;
  filename: string;
  url?: string;
  type: string;
  size: number;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-upload-container">
      <div class="upload-area" 
           (click)="fileInput.click()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           [class.dragover]="isDragging">
        <input 
          #fileInput
          type="file"
          (change)="onFileSelected($event)"
          multiple
          style="display: none;"
        />
        <div class="upload-content">
          <span class="upload-icon">📎</span>
          <p class="upload-text">Click or drag files to upload</p>
          <p class="upload-hint">Max 10MB per file</p>
        </div>
      </div>
      
      @if (attachments.length > 0) {
        <div class="attachments-list">
          @for (attachment of attachments; track attachment.id) {
            <div class="attachment-item">
              <span class="attachment-icon">{{ getFileIcon(attachment.type) }}</span>
              <span class="attachment-name">{{ attachment.filename }}</span>
              <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
              <button 
                class="btn-remove"
                (click)="removeAttachment(attachment.id)"
                type="button"
              >
                ×
              </button>
            </div>
          }
        </div>
      }
      
      @if (uploading) {
        <div class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="uploadProgress"></div>
          </div>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .file-upload-container {
      width: 100%;
    }
    .upload-area {
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.05);
    }
    .upload-area:hover {
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.1);
    }
    .upload-area.dragover {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }
    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .upload-icon {
      font-size: 32px;
    }
    .upload-text {
      margin: 0;
      color: #fff;
      font-size: 14px;
    }
    .upload-hint {
      margin: 0;
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }
    .attachments-list {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .attachment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-size: 14px;
    }
    .attachment-icon {
      font-size: 20px;
    }
    .attachment-name {
      flex: 1;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .attachment-size {
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }
    .btn-remove {
      background: rgba(255, 0, 0, 0.2);
      border: none;
      color: #ff6b6b;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-remove:hover {
      background: rgba(255, 0, 0, 0.3);
    }
    .upload-progress {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .progress-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }
    .progress-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      min-width: 40px;
    }
  `]
})
export class FileUploadComponent {
  @Input() taskId?: number;
  @Output() attachmentsChange = new EventEmitter<Attachment[]>();
  
  attachments: Attachment[] = [];
  isDragging = false;
  uploading = false;
  uploadProgress = 0;
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadFiles(Array.from(event.dataTransfer.files));
    }
  }

  uploadFiles(files: File[]) {
    if (!this.taskId) {
      // Store files temporarily if task doesn't exist yet
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.attachments.push({
            id: Date.now() + Math.random(), // Temporary ID
            filename: file.name,
            type: file.type,
            size: file.size,
            url: e.target.result // Data URL for preview
          } as Attachment);
          this.attachmentsChange.emit(this.attachments);
        };
        reader.readAsDataURL(file);
      });
      return;
    }

    // Upload to server
    files.forEach(file => {
      this.uploadFile(file);
    });
  }

  private uploadFile(file: File) {
    if (!this.taskId) return;

    const formData = new FormData();
    formData.append('file', file);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.uploading = true;
    this.uploadProgress = 0;

    this.http.post<any>(
      `${this.apiUrl}/tasks/${this.taskId}/attachments`,
      formData,
      { headers, reportProgress: true, observe: 'events' }
    ).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.attachments.push(event.body);
          this.attachmentsChange.emit(this.attachments);
          this.uploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploading = false;
        this.uploadProgress = 0;
        alert('Failed to upload file: ' + (error.error?.message || error.message));
      }
    });
  }

  removeAttachment(id: number) {
    const attachment = this.attachments.find(a => a.id === id);
    if (!attachment) return;

    // If task exists, delete from server
    if (this.taskId && attachment.url && !attachment.url.startsWith('data:')) {
      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.delete(
        `${this.apiUrl}/tasks/${this.taskId}/attachments/${id}`,
        { headers }
      ).subscribe({
        next: () => {
          this.attachments = this.attachments.filter(a => a.id !== id);
          this.attachmentsChange.emit(this.attachments);
        },
        error: (error) => {
          console.error('Delete failed:', error);
          alert('Failed to delete attachment');
        }
      });
    } else {
      // Just remove from local list
      this.attachments = this.attachments.filter(a => a.id !== id);
      this.attachmentsChange.emit(this.attachments);
    }
  }

  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  loadAttachments(taskId: number) {
    this.taskId = taskId;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<Attachment[]>(
      `${this.apiUrl}/tasks/${taskId}/attachments`,
      { headers }
    ).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.attachmentsChange.emit(this.attachments);
      },
      error: (error) => {
        console.error('Failed to load attachments:', error);
      }
    });
  }
}

