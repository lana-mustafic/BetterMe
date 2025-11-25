import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardShortcutsService } from '../../services/keyboard-shortcuts.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible) {
      <div class="shortcuts-overlay" (click)="close()">
        <div class="shortcuts-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Keyboard Shortcuts</h2>
            <button class="close-btn" (click)="close()">×</button>
          </div>
          <div class="modal-content">
            <div class="shortcuts-list">
              @for (shortcut of shortcuts; track shortcut.key) {
                <div class="shortcut-item">
                  <div class="shortcut-keys">
                    @for (key of getKeyParts(shortcut.key); track $index) {
                      <kbd class="key">{{ key }}</kbd>
                      @if (!$last) {
                        <span class="key-separator">+</span>
                      }
                    }
                  </div>
                  <div class="shortcut-description">{{ shortcut.description }}</div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .shortcuts-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .shortcuts-modal {
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-header h2 {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .modal-content {
      padding: 1.5rem;
    }

    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .shortcut-keys {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .key {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: white;
      font-family: monospace;
      min-width: 24px;
      text-align: center;
    }

    .key-separator {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }

    .shortcut-description {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.95rem;
    }

    @media (max-width: 768px) {
      .shortcut-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .shortcut-keys {
        width: 100%;
      }
    }
  `]
})
export class KeyboardShortcutsHelpComponent implements OnInit, OnDestroy {
  private shortcutsService = inject(KeyboardShortcutsService);
  private subscription = new Subscription();

  isVisible = false;
  shortcuts = this.shortcutsService.getRegisteredShortcuts();

  ngOnInit() {
    // Listen for show shortcuts help event
    window.addEventListener('show-shortcuts-help', () => {
      this.isVisible = true;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    window.removeEventListener('show-shortcuts-help', () => {});
  }

  close(): void {
    this.isVisible = false;
  }

  getKeyParts(key: string): string[] {
    return key.split('+').map(k => {
      if (k === 'ctrl') return 'Ctrl';
      if (k === 'shift') return 'Shift';
      if (k === 'alt') return 'Alt';
      return k.toUpperCase();
    });
  }
}

