import { Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { SkillsComponent } from './skills/skills.component';
import { ProjectsComponent } from './projects/projects.component';
import { ExperienceComponent } from './experience/experience.component';
import { ContactComponent } from './contact/contact.component';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    title: 'Amol Nagare - Home'
  },
  { 
    path: 'about', 
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent),
    title: 'About Me'
  },
  { 
    path: 'skills', 
    loadComponent: () => import('./skills/skills.component').then(m => m.SkillsComponent),
    title: 'My Skills'
  },
  { 
    path: 'projects', 
    loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent),
    title: 'My Projects'
  },
  { 
    path: 'experience', 
    loadComponent: () => import('./experience/experience.component').then(m => m.ExperienceComponent),
    title: 'My Experience'
  },
  { 
    path: 'contact', 
    loadComponent: () => import('./contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact Me'
  },
  { path: '**', redirectTo: '' }
];