import { Routes } from '@angular/router';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { OnlineClipboardComponent } from './components/online-clipboard/online-clipboard.component';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    title: 'Amol Nagare - Full Stack Developer'
  },
  { 
    path: 'about', 
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent),
    title: 'About Me - Amol Nagare'
  },
  { 
    path: 'skills', 
    loadComponent: () => import('./skills/skills.component').then(m => m.SkillsComponent),
    title: 'My Skills - Amol Nagare'
  },
  { 
    path: 'projects', 
    loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent),
    title: 'My Projects - Amol Nagare'
  },
  { 
    path: 'online-clipboard', 
    component: OnlineClipboardComponent,
    title: 'Online Clipboard - Share Text Across Devices'
  },
  { 
    path: 'experience', 
    loadComponent: () => import('./experience/experience.component').then(m => m.ExperienceComponent),
    title: 'Experience - Amol Nagare'
  },
  { 
    path: 'contact', 
    loadComponent: () => import('./contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact - Amol Nagare'
  },
  { 
    path: 'admin/login', 
    component: AdminLoginComponent,
    title: 'Admin Login'
  },
  { 
    path: 'admin', 
    component: AdminDashboardComponent,
    title: 'Admin Dashboard'
  },
  { path: '**', redirectTo: '' }
];