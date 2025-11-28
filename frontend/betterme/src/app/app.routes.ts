import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent,
    data: { title: 'Home - TaskFlow' }
  },
  { 
    path: 'login', 
    component: LoginComponent,
    data: { title: 'Login - TaskFlow' }
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    data: { title: 'Register - TaskFlow' }
  },

  // Tasks Routes - Lazy Loaded
  { 
    path: 'tasks', 
    loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent),
    canActivate: [authGuard],
    data: { 
      title: 'My Tasks - TaskFlow',
      breadcrumb: 'Tasks'
    }
  },
  { 
    path: 'tasks/:id', 
    loadComponent: () => import('./pages/task-detail/task-detail.component').then(m => m.TaskDetailComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Task Details - TaskFlow',
      breadcrumb: 'Task Details'
    }
  },
  { 
    path: 'tasks/:id/edit',
    loadComponent: () => import('./pages/edit-task/edit-task.component').then(m => m.EditTaskComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Edit Task - TaskFlow',
      breadcrumb: 'Edit Task'
    }
  },
  { 
    path: 'tasks/new',
    loadComponent: () => import('./pages/edit-task/edit-task.component').then(m => m.EditTaskComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Create Task - TaskFlow',
      breadcrumb: 'Create Task'
    }
  },
  { 
    path: 'tasks/kanban', 
    loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Kanban Board - TaskFlow',
      breadcrumb: 'Kanban Board'
    }
  },

  // Habits Route - Lazy Loaded
  { 
    path: 'habits', 
    loadComponent: () => import('./pages/habit-tracker/habit-tracker.component').then(m => m.HabitTrackerComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Habit Tracker - TaskFlow',
      breadcrumb: 'Habit Tracker'
    }
  },

  // Focus Mode Route - Lazy Loaded
  { 
    path: 'focus', 
    loadComponent: () => import('./pages/focus-mode/focus-mode.component').then(m => m.FocusModeComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Focus Mode - TaskFlow',
      breadcrumb: 'Focus Mode'
    }
  },

  // My Day Route - Lazy Loaded
  { 
    path: 'my-day', 
    loadComponent: () => import('./pages/my-day/my-day.component').then(m => m.MyDayComponent),
    canActivate: [authGuard],
    data: { 
      title: 'My Day - TaskFlow',
      breadcrumb: 'My Day'
    }
  },

  // Profile Routes - Lazy Loaded
  { 
    path: 'profile', 
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    data: { 
      title: 'My Profile - TaskFlow',
      breadcrumb: 'Profile'
    }
  },
  { 
    path: 'profile/edit',
    loadComponent: () => import('./pages/edit-profile/edit-profile.component').then(m => m.EditProfileComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Edit Profile - TaskFlow',
      breadcrumb: 'Edit Profile'
    }
  },
  { 
    path: 'profile/change-password',
    loadComponent: () => import('./pages/password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard],
    data: { 
      title: 'Change Password - TaskFlow',
      breadcrumb: 'Change Password'
    }
  },

  // Redirect all unknown routes to home - THIS SHOULD BE LAST
  { 
    path: '**', 
    redirectTo: '',
    pathMatch: 'full'
  }
];