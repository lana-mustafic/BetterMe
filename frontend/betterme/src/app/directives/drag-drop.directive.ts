import { Directive, Input, Output, EventEmitter, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appDragDrop]',
  standalone: true
})
export class DragDropDirective implements OnInit, OnDestroy {
  @Input() dragData: any;
  @Input() dragGroup: string = 'default';
  @Input() disabled: boolean = false;
  @Output() dragStart = new EventEmitter<any>();
  @Output() dragEnd = new EventEmitter<any>();
  @Output() drop = new EventEmitter<{ data: any; target: any }>();

  private isDragging = false;
  private dragElement: HTMLElement | null = null;
  private placeholder: HTMLElement | null = null;
  private listeners: (() => void)[] = [];

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    if (!this.disabled) {
      this.renderer.setAttribute(this.el.nativeElement, 'draggable', 'true');
      this.setupListeners();
    }
  }

  ngOnDestroy() {
    this.listeners.forEach(cleanup => cleanup());
  }

  private setupListeners() {
    const dragStartListener = this.renderer.listen(
      this.el.nativeElement,
      'dragstart',
      (e: DragEvent) => this.onDragStart(e)
    );

    const dragEndListener = this.renderer.listen(
      this.el.nativeElement,
      'dragend',
      (e: DragEvent) => this.onDragEnd(e)
    );

    const dragOverListener = this.renderer.listen(
      this.el.nativeElement,
      'dragover',
      (e: DragEvent) => this.onDragOver(e)
    );

    const dropListener = this.renderer.listen(
      this.el.nativeElement,
      'drop',
      (e: DragEvent) => this.onDrop(e)
    );

    const dragEnterListener = this.renderer.listen(
      this.el.nativeElement,
      'dragenter',
      (e: DragEvent) => this.onDragEnter(e)
    );

    const dragLeaveListener = this.renderer.listen(
      this.el.nativeElement,
      'dragleave',
      (e: DragEvent) => this.onDragLeave(e)
    );

    this.listeners.push(
      dragStartListener,
      dragEndListener,
      dragOverListener,
      dropListener,
      dragEnterListener,
      dragLeaveListener
    );
  }

  private onDragStart(e: DragEvent) {
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    this.isDragging = true;
    this.dragElement = this.el.nativeElement;

    // Add dragging class
    this.renderer.addClass(this.el.nativeElement, 'dragging');

    // Set drag data
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({
        data: this.dragData,
        group: this.dragGroup
      }));
    }

    // Create placeholder
    this.createPlaceholder();

    this.dragStart.emit(this.dragData);
  }

  private onDragEnd(e: DragEvent) {
    this.isDragging = false;
    this.renderer.removeClass(this.el.nativeElement, 'dragging');

    // Remove placeholder
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }

    // Remove drop zone classes from all elements
    const allElements = document.querySelectorAll('.drop-zone-active');
    allElements.forEach(el => {
      this.renderer.removeClass(el, 'drop-zone-active');
    });

    this.dragElement = null;
    this.placeholder = null;
    this.dragEnd.emit(this.dragData);
  }

  private onDragOver(e: DragEvent) {
    if (!this.isDragging || this.disabled) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  private onDrop(e: DragEvent) {
    if (!this.isDragging || this.disabled) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      try {
        const transferData = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        if (transferData.group === this.dragGroup) {
          this.drop.emit({
            data: transferData.data,
            target: this.dragData
          });
        }
      } catch (err) {
        console.error('Error parsing drag data:', err);
      }
    }

    this.renderer.removeClass(this.el.nativeElement, 'drop-zone-active');
  }

  private onDragEnter(e: DragEvent) {
    if (!this.isDragging || this.disabled) return;

    e.preventDefault();
    e.stopPropagation();

    if (this.el.nativeElement !== this.dragElement) {
      this.renderer.addClass(this.el.nativeElement, 'drop-zone-active');
    }
  }

  private onDragLeave(e: DragEvent) {
    if (!this.isDragging || this.disabled) return;

    // Only remove class if we're actually leaving the element
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!this.el.nativeElement.contains(relatedTarget)) {
      this.renderer.removeClass(this.el.nativeElement, 'drop-zone-active');
    }
  }

  private createPlaceholder() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.placeholder = this.renderer.createElement('div');
    this.renderer.addClass(this.placeholder, 'drag-placeholder');
    this.renderer.setStyle(this.placeholder, 'width', `${rect.width}px`);
    this.renderer.setStyle(this.placeholder, 'height', `${rect.height}px`);
    this.renderer.insertBefore(
      this.el.nativeElement.parentNode,
      this.placeholder,
      this.el.nativeElement
    );
  }
}

