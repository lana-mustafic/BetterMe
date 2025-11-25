# UI/UX Features Guide

This document describes the new UI/UX enhancements added to BetterMe.

## 1. Theme System

### Dark Mode Toggle
The app now supports light, dark, and auto (system preference) themes.

**Usage:**
- Click the theme toggle button in the navbar
- Choose between Light, Dark, or Auto
- Your preference is saved automatically

### Customizable Accent Colors
Choose from 6 accent color themes:
- Purple (default)
- Blue
- Green
- Orange
- Red
- Pink

**Usage:**
- Click the theme toggle button
- Select your preferred accent color
- The entire app will update with your chosen color scheme

## 2. Keyboard Shortcuts

The app includes keyboard shortcuts for faster navigation:

- **N** - Create new task
- **/** - Focus search input
- **G then T** - Go to Tasks
- **G then H** - Go to Home
- **Escape** - Close modals/dropdowns
- **Shift + ?** - Show keyboard shortcuts help

**Note:** Shortcuts are disabled when typing in input fields (except Ctrl/Cmd shortcuts).

## 3. Drag and Drop

Tasks can be reordered using drag and drop.

**Usage:**
```typescript
import { DragDropDirective } from './directives/drag-drop.directive';

// In your template:
<div 
  *ngFor="let task of tasks" 
  appDragDrop
  [dragData]="task"
  dragGroup="tasks"
  (drop)="onTaskReorder($event)">
  <!-- Task content -->
</div>
```

**Example handler:**
```typescript
onTaskReorder(event: { data: any; target: any }) {
  // Reorder tasks
  const fromIndex = this.tasks.indexOf(event.data);
  const toIndex = this.tasks.indexOf(event.target);
  // Move task logic here
}
```

## 4. Loading Skeletons

Use loading skeletons to show loading states instead of spinners.

**Usage:**
```typescript
import { LoadingSkeletonComponent, SkeletonListComponent } from './components/loading-skeleton/loading-skeleton.component';

// Single skeleton
<app-loading-skeleton type="card" width="100%" height="200px"></app-loading-skeleton>

// Skeleton list
<app-skeleton-list [count]="5"></app-skeleton-list>
```

**Available types:**
- `text` - Text line
- `title` - Title line (60% width)
- `paragraph` - Paragraph lines
- `avatar` - Circular avatar
- `card` - Card skeleton
- `button` - Button skeleton
- `custom` - Custom dimensions

## 5. Empty States

Display helpful messages when lists are empty.

**Usage:**
```typescript
import { EmptyStateComponent } from './components/empty-state/empty-state.component';

<app-empty-state
  icon="📝"
  title="No tasks yet"
  description="Get started by creating your first task. Click the 'Add New Task' button above."
  actionLabel="Create Task"
  [actionCallback]="createTask">
</app-empty-state>
```

## 6. Onboarding Tour

New users automatically see an onboarding tour on their first visit.

**Features:**
- Highlights key features
- Step-by-step guidance
- Can be skipped
- Remembers completion status

**To restart the tour:**
```typescript
localStorage.removeItem('betterme-tour-completed');
// Refresh the page
```

## 7. Smooth Animations

The app includes smooth animations for:
- Page transitions
- Card hover effects
- Button interactions
- Modal appearances
- List item animations

All animations respect `prefers-reduced-motion` for accessibility.

## 8. Integration Examples

### Using in Tasks Component

```typescript
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { DragDropDirective } from '../../directives/drag-drop.directive';

@Component({
  // ...
  imports: [LoadingSkeletonComponent, EmptyStateComponent, DragDropDirective]
})
export class TasksComponent {
  isLoading = false;
  tasks: Task[] = [];

  createTask() {
    // Navigate to create task
  }
}
```

```html
@if (isLoading) {
  <app-skeleton-list [count]="5"></app-skeleton-list>
} @else if (tasks.length === 0) {
  <app-empty-state
    icon="📝"
    title="No tasks yet"
    description="Get started by creating your first task."
    actionLabel="Create Task"
    [actionCallback]="createTask">
  </app-empty-state>
} @else {
  <div 
    *ngFor="let task of tasks"
    appDragDrop
    [dragData]="task"
    dragGroup="tasks"
    (drop)="onTaskReorder($event)">
    <!-- Task content -->
  </div>
}
```

## Styling

All components use CSS variables for theming, so they automatically adapt to:
- Light/Dark mode
- Custom accent colors
- User preferences

## Accessibility

- All animations respect `prefers-reduced-motion`
- Keyboard navigation support
- ARIA labels where appropriate
- Focus management in modals

