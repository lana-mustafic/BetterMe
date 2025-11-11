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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { 
    path: 'tasks', 
    component: TasksComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'tasks/:id', 
    component: TaskDetailComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'tasks/:id/edit',
    component: EditTaskComponent,
    canActivate: [authGuard]
  },

  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'profile/edit',
    component: EditProfileComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'profile/change-password',
    component: ChangePasswordComponent,
    canActivate: [authGuard]
  },

  // REMOVED: verify-email route

  { path: '**', redirectTo: '' }
];