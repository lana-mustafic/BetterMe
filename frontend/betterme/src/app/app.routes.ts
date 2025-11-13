import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { TaskDetailComponent } from './pages/task-detail/task-detail.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { EditTaskComponent } from './pages/edit-task/edit-task.component';
import { EditProfileComponent } from './pages/edit-profile/edit-profile.component';
import { ChangePasswordComponent } from './pages/password/change-password.component';
import { authGuard } from './guards/auth.guard';
import { HabitTrackerComponent } from './pages/habit-tracker/habit-tracker.component'; 
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

  // Tasks Routes
  { 
    path: 'tasks', 
    component: TasksComponent,
    canActivate: [authGuard],
    data: { 
      title: 'My Tasks - TaskFlow',
      breadcrumb: 'Tasks'
    }
  },
  { 
    path: 'tasks/:id', 
    component: TaskDetailComponent,
    canActivate: [authGuard],
    data: { 
      title: 'Task Details - TaskFlow',
      breadcrumb: 'Task Details'
    }
  },
  { 
    path: 'tasks/:id/edit',
    component: EditTaskComponent,
    canActivate: [authGuard],
    data: { 
      title: 'Edit Task - TaskFlow',
      breadcrumb: 'Edit Task'
    }
  },
  { 
    path: 'tasks/new',
    component: EditTaskComponent,
    canActivate: [authGuard],
    data: { 
      title: 'Create Task - TaskFlow',
      breadcrumb: 'Create Task'
    }
  },
  { 
    path: 'tasks/kanban', 
    component: TasksComponent,
    canActivate: [authGuard],
    data: { 
      title: 'Kanban Board - TaskFlow',
      breadcrumb: 'Kanban Board'
    }
  },

  // Profile Routes
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { 
      title: 'My Profile - TaskFlow',
      breadcrumb: 'Profile'
    }
  },
  { 
    path: 'profile/edit',
    component: EditProfileComponent,
    canActivate: [authGuard],
    data: { 
      title: 'Edit Profile - TaskFlow',
      breadcrumb: 'Edit Profile'
    }
  },
  { 
    path: 'profile/change-password',
    component: ChangePasswordComponent,
    canActivate: [authGuard],
    data: { 
      title: 'Change Password - TaskFlow',
      breadcrumb: 'Change Password'
    }
  },

  // Redirect all unknown routes to home
  { 
    path: '**', 
    redirectTo: '',
    pathMatch: 'full'
  },

  { 
  path: 'habits', 
  component: HabitTrackerComponent,
  canActivate: [authGuard],
  data: { 
    title: 'Habit Tracker - TaskFlow',
    breadcrumb: 'Habit Tracker'
  }
}
];