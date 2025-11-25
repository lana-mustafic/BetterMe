import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  private router = inject(Router);
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private shortcutSubject = new Subject<{ key: string; description: string }>();
  public shortcutPressed$ = this.shortcutSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      (target as any).isContentEditable
    ) {
      // Allow shortcuts with Ctrl/Cmd modifier even in inputs
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
    }

    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
      this.shortcutSubject.next({ key, description: shortcut.description });
    }
  }

  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl || shortcut.meta) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  // Common shortcuts
  registerCommonShortcuts(): void {
    // N - New task
    this.register({
      key: 'n',
      action: () => this.router.navigate(['/tasks']).then(() => {
        // Trigger create task after navigation
        setTimeout(() => {
          const createBtn = document.querySelector('button:has-text("Add New Task"), .btn-gradient') as HTMLElement;
          if (createBtn) createBtn.click();
        }, 100);
      }),
      description: 'Create new task'
    });

    // / - Focus search
    this.register({
      key: '/',
      action: () => this.focusSearch(),
      description: 'Focus search'
    });

    // G then H - Go to Home
    this.register({
      key: 'g',
      action: () => {
        // Simple implementation - just navigate to home
        this.router.navigate(['/']);
      },
      description: 'Go to home'
    });

    // G then T - Go to Tasks (Ctrl+G for now, or we can improve sequence handling later)
    this.register({
      key: 't',
      ctrl: true,
      action: () => this.router.navigate(['/tasks']),
      description: 'Go to tasks (Ctrl+T)'
    });

    // Escape - Close modals/dropdowns
    this.register({
      key: 'Escape',
      action: () => this.closeModals(),
      description: 'Close modal/dropdown'
    });

    // ? - Show keyboard shortcuts help
    this.register({
      key: '?',
      shift: true,
      action: () => this.showShortcutsHelp(),
      description: 'Show keyboard shortcuts'
    });
  }

  private focusSearch(): void {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    } else {
      // Try to find any input that might be a search
      const inputs = document.querySelectorAll('input[type="text"]');
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i] as HTMLInputElement;
        if (input.placeholder && input.placeholder.toLowerCase().includes('search')) {
          input.focus();
          input.select();
          break;
        }
      }
    }
  }

  private closeModals(): void {
    // Close any open modals, dropdowns, etc.
    const modals = document.querySelectorAll('.modal, .dropdown, .popover, [class*="modal"], [class*="dropdown"]');
    modals.forEach(modal => {
      const el = modal as HTMLElement;
      if (el.style.display !== 'none') {
        el.style.display = 'none';
      }
    });
    
    // Dispatch close event for components that listen to it
    const event = new CustomEvent('close-modals');
    window.dispatchEvent(event);
  }

  private showShortcutsHelp(): void {
    // This will be handled by a help modal component
    const event = new CustomEvent('show-shortcuts-help');
    window.dispatchEvent(event);
  }

  getRegisteredShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
}

