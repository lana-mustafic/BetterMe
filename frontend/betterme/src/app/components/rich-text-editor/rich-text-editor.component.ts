import { Component, ElementRef, forwardRef, Input, AfterViewInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
// @ts-ignore - Quill types may not be available
import Quill from 'quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ],
  template: `
    <div class="rich-text-editor-container">
      <div #editorContainer class="editor-container"></div>
    </div>
  `,
  styles: [`
    .rich-text-editor-container {
      width: 100%;
    }
    .editor-container {
      min-height: 150px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: text;
      pointer-events: auto;
    }
    :host ::ng-deep .ql-container {
      font-family: inherit;
      font-size: 14px;
      color: white;
      min-height: 150px;
      cursor: text;
      pointer-events: auto;
    }
    :host ::ng-deep .ql-editor {
      min-height: 150px;
      color: white;
      cursor: text;
      pointer-events: auto;
    }
    :host ::ng-deep .ql-editor.ql-blank::before {
      color: rgba(255, 255, 255, 0.6);
      font-style: normal;
    }
    :host ::ng-deep .ql-toolbar {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    :host ::ng-deep .ql-container {
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }
    :host ::ng-deep .ql-editor:focus {
      outline: none;
    }
  `]
})
export class RichTextEditorComponent implements AfterViewInit, ControlValueAccessor {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;
  
  @Input() placeholder: string = 'Enter description...';
  
  private quill: any;
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngAfterViewInit() {
    // Wait for the view to be initialized
    if (!this.editorContainer || !this.editorContainer.nativeElement) {
      console.error('Editor container not found');
      return;
    }

    // Initialize Quill editor
    try {
      this.quill = new Quill(this.editorContainer.nativeElement, {
        theme: 'snow',
        placeholder: this.placeholder,
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
          ]
        }
      });

      // Ensure editor is enabled and focusable
      this.quill.enable(true);

      // Listen for text changes
      this.quill.on('text-change', () => {
        const content = this.quill.root.innerHTML;
        this.onChange(content);
      });

      // Listen for focus events to mark as touched
      this.quill.on('selection-change', (range: any) => {
        if (range) {
          this.onTouched();
        }
      });

      // Make editor clickable and focusable
      this.quill.root.setAttribute('contenteditable', 'true');
    } catch (error) {
      console.error('Error initializing Quill editor:', error);
    }
  }

  writeValue(value: string): void {
    if (this.quill && value !== undefined && value !== null) {
      this.quill.root.innerHTML = value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.quill) {
      this.quill.enable(!isDisabled);
    }
  }
}

