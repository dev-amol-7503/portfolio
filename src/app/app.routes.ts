import { Routes } from '@angular/router';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { OnlineClipboardComponent } from './components/online-clipboard/online-clipboard.component';
import { adminGuard } from './guards/admin.guard';
import { ProjectsComponent } from './projects/projects.component';
import { SkillsComponent } from './skills/skills.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
    title: 'Amol Nagare - Full Stack Developer',
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about.component').then((m) => m.AboutComponent),
    title: 'About Me - Amol Nagare',
  },
  {
    path: 'skills',
    loadComponent: () =>
      import('./skills/skills.component').then((m) => m.SkillsComponent),
    title: 'My Skills - Amol Nagare',
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./projects/projects.component').then((m) => m.ProjectsComponent),
    title: 'My Projects - Amol Nagare',
  },
  {
    path: 'online-clipboard',
    loadComponent: () =>
      import('./components/online-clipboard/online-clipboard.component').then(
        (m) => m.OnlineClipboardComponent
      ),
    title: 'Online Clipboard - Share Text Across Devices',
  },
  {
    path: 'experience',
    loadComponent: () =>
      import('./experience/experience.component').then(
        (m) => m.ExperienceComponent
      ),
    title: 'Experience - Amol Nagare',
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contact - Amol Nagare',
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    title: 'Admin Login',
  },
  // Admin Dashboard with nested routes
  {
    path: 'admin',
    component: AdminDashboardComponent,
    title: 'Admin Dashboard',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      // { 
      //   path: 'overview', 
      //   component: AdminOverviewComponent,
      //   title: 'Admin Overview'
      // },
      { 
        path: 'projects', 
        component: ProjectsComponent,
        title: 'Admin Projects'
      },
      { 
        path: 'skills', 
        component: SkillsComponent,
        title: 'Admin Skills'
      },
      // Matrix Notes Routes - Integrated in Admin Dashboard
      {
        path: 'matrix-notes',
        loadComponent: () =>
          import(
            './projects/matrix-notes/matrix-notes-dashboard/matrix-notes-dashboard.component'
          ).then((m) => m.MatrixNotesDashboardComponent),
        title: 'Matrix Notes Dashboard',
      },
      {
        path: 'matrix-notes/editor',
        loadComponent: () =>
          import(
            './projects/matrix-notes/matrix-notes-editor/matrix-notes-editor.component'
          ).then((m) => m.MatrixNotesEditorComponent),
        title: 'Matrix Notes Editor',
      },
      {
        path: 'matrix-notes/editor/:id',
        loadComponent: () =>
          import(
            './projects/matrix-notes/matrix-notes-editor/matrix-notes-editor.component'
          ).then((m) => m.MatrixNotesEditorComponent),
        title: 'Matrix Notes Editor',
      },
      // Developer Solutions Routes - Integrated in Admin Dashboard
      {
        path: 'developer-solutions',
        loadComponent: () =>
          import('./projects/developer-solution/developer-solutions-dashboard/developer-solutions-dashboard.component').then(
            (m) => m.DeveloperSolutionsDashboardComponent
          ),
        title: 'Developer Solutions Dashboard',
      },
      {
        path: 'developer-solutions/editor',
        loadComponent: () =>
          import('./projects/developer-solution/developer-solutions-editor/developer-solutions-editor.component').then(
            (m) => m.DeveloperSolutionsEditorComponent
          ),
        title: 'Developer Solutions Editor',
      },
      {
        path: 'developer-solutions/editor/:id',
        loadComponent: () =>
          import('./projects/developer-solution/developer-solutions-editor/developer-solutions-editor.component').then(
            (m) => m.DeveloperSolutionsEditorComponent
          ),
        title: 'Developer Solutions Editor',
      },
    ]
  },
  // Public routes for Matrix Notes
  {
    path: 'tutorials',
    loadComponent: () =>
      import(
        './projects/matrix-notes/tutorials-list/tutorials-list.component'
      ).then((m) => m.TutorialsListComponent),
    title: 'Matrix Notes - Tutorials',
  },
  {
    path: 'tutorials/:id',
    loadComponent: () =>
      import(
        './projects/matrix-notes/tutorial-detail/tutorial-detail.component'
      ).then((m) => m.TutorialDetailComponent),
    title: 'Matrix Notes - Tutorial',
  },
  // Public routes for Developer Solutions
  {
    path: 'solutions/:id',
    loadComponent: () =>
      import('./projects/developer-solution/solution-detail/solution-detail.component').then(
        (m) => m.SolutionDetailComponent
      ),
    title: 'Developer Solution',
  },
  { path: '**', redirectTo: '' },
];