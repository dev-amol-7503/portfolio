import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { AdminService } from '../services/admin.service';
import { Project, SocialPost } from '../interfaces/social-post.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  isDarkTheme = false;
  isEditMode = false;

  // Visible items arrays
  visibleProjects: Project[] = [];
  visibleMediumPosts: SocialPost[] = [];
  visibleQuoraPosts: SocialPost[] = [];
  visibleLinkedinPosts: SocialPost[] = [];

  // Number of items to show initially and per click
  private readonly initialItemsToShow = 3;
  private readonly itemsPerLoad = 3;

  activeTab: string = 'projects';

  projects: Project[] = [];
  mediumPosts: SocialPost[] = [];
  quoraPosts: SocialPost[] = [];
  linkedinPosts: SocialPost[] = [];

  newProject: Partial<Project> = {};

  constructor(
    private themeService: ThemeService,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe((isDark) => {
      this.isDarkTheme = isDark;
    });

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });

    this.adminService.portfolioData$.subscribe(data => {
      this.projects = data.projects || [];
      this.mediumPosts = data.socialPosts?.filter(post => post.platform === 'medium') || [];
      this.quoraPosts = data.socialPosts?.filter(post => post.platform === 'quora') || [];
      this.linkedinPosts = data.socialPosts?.filter(post => post.platform === 'linkedin') || [];
      
      this.resetVisibleItems();
    });
  }

  // Reset all visible items to initial state
  resetVisibleItems() {
    this.visibleProjects = this.projects.slice(0, this.initialItemsToShow);
    this.visibleMediumPosts = this.mediumPosts.slice(0, this.initialItemsToShow);
    this.visibleQuoraPosts = this.quoraPosts.slice(0, this.initialItemsToShow);
    this.visibleLinkedinPosts = this.linkedinPosts.slice(0, this.initialItemsToShow);
  }

  // Update this when tab changes
  onTabChange(tabId: string) {
    this.activeTab = tabId;
    this.resetVisibleItems();
  }

  showMoreProjects() {
    const nextItems = this.projects.slice(
      this.visibleProjects.length,
      this.visibleProjects.length + this.itemsPerLoad
    );
    this.visibleProjects = [...this.visibleProjects, ...nextItems];
  }

  showMoreMediumPosts() {
    const nextItems = this.mediumPosts.slice(
      this.visibleMediumPosts.length,
      this.visibleMediumPosts.length + this.itemsPerLoad
    );
    this.visibleMediumPosts = [...this.visibleMediumPosts, ...nextItems];
  }

  showMoreQuoraPosts() {
    const nextItems = this.quoraPosts.slice(
      this.visibleQuoraPosts.length,
      this.visibleQuoraPosts.length + this.itemsPerLoad
    );
    this.visibleQuoraPosts = [...this.visibleQuoraPosts, ...nextItems];
  }

  showMoreLinkedinPosts() {
    const nextItems = this.linkedinPosts.slice(
      this.visibleLinkedinPosts.length,
      this.visibleLinkedinPosts.length + this.itemsPerLoad
    );
    this.visibleLinkedinPosts = [...this.visibleLinkedinPosts, ...nextItems];
  }

  getTechIcon(tech: string): string {
    const icons: { [key: string]: string } = {
      Angular: 'fab fa-angular',
      TypeScript: 'fas fa-code',
      Bootstrap: 'fab fa-bootstrap',
      RxJS: 'fas fa-project-diagram',
      'Node.js': 'fab fa-node-js',
      MongoDB: 'fas fa-database',
      Stripe: 'fab fa-stripe',
      Firebase: 'fab fa-firebase',
      NgRx: 'fas fa-store',
      DragDrop: 'fas fa-arrows-alt',
    };

    return icons[tech] || 'fas fa-code';
  }

  // Edit mode methods
  addNewProject() {
    if (this.isEditMode && this.newProject.title && this.newProject.description) {
      const project: Project = {
        id: Date.now(),
        title: this.newProject.title,
        description: this.newProject.description,
        technologies: this.newProject.technologies || ['Angular'],
        imageUrl: this.newProject.imageUrl || 'assets/images/project-placeholder.jpg',
        link: this.newProject.link || '#',
        githubLink: this.newProject.githubLink,
        category: this.newProject.category || 'Web Application',
        featured: this.newProject.featured || false
      };
      
      this.adminService.addProject(project);
      this.newProject = {};
      this.resetVisibleItems();
    }
  }

  deleteProject(project: Project, event: Event) {
    if (this.isEditMode) {
      event.preventDefault();
      event.stopPropagation();
      
      if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
        this.adminService.deleteProject(project.id);
      }
    }
  }
}