import {
  Component,
  OnInit,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeConfig } from '../services/theme.service';
import { AdminService } from '../services/admin.service';
import { Project, SocialPost } from '../interfaces/social-post.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import lottie from 'lottie-web';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('lottieContainer') lottieContainers!: QueryList<ElementRef>;

  isScrolledStart = false;
  isScrolledEnd = false;
  isScrolledMiddle = false;
  showScrollHint = false;

  isDarkTheme = false;
  isEditMode = false;
  currentTheme!: ThemeConfig;
  activeTab: string = 'projects';

  projects: Project[] = [];
  mediumPosts: SocialPost[] = [];
  quoraPosts: SocialPost[] = [];
  linkedinPosts: SocialPost[] = [];

  // Updated newProject type for form handling
  newProject: {
    title?: string;
    description?: string;
    technologies?: string;
    imageUrl?: string;
    animationUrl?: string;
    link?: string;
    githubLink?: string;
    category?: string;
    featured?: boolean;
  } = {};

  private lottieAnimations: any[] = [];

  constructor(
    private themeService: ThemeService,
    private adminService: AdminService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe((isDark) => {
      this.isDarkTheme = isDark;
    });

    this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;
    });

    this.adminService.editMode$.subscribe((mode) => {
      this.isEditMode = mode;
    });

    this.adminService.portfolioData$.subscribe((data) => {
      console.log('🔄 Portfolio Data Received:', data);

      // FIXED: Proper data filtering with debugging
      this.projects = data.projects || [];

      // Debug social posts before filtering
      console.log('🔍 All Social Posts:', data.socialPosts);

      // FIXED: Case-insensitive platform filtering
      this.mediumPosts =
        data.socialPosts?.filter(
          (post) => post.platform?.toLowerCase() === 'medium'
        ) || [];

      this.quoraPosts =
        data.socialPosts?.filter(
          (post) => post.platform?.toLowerCase() === 'quora'
        ) || [];

      this.linkedinPosts =
        data.socialPosts?.filter(
          (post) => post.platform?.toLowerCase() === 'linkedin'
        ) || [];

      // DEBUG: Log current state
      this.logCurrentState();

      // Force change detection
      this.cdRef.detectChanges();

      // Reinitialize Lottie animations when data changes
      setTimeout(() => {
        this.initializeLottieAnimations();
      }, 100);
    });
  }

  ngAfterViewInit() {
    this.initializeLottieAnimations();

    this.lottieContainers.changes.subscribe(() => {
      this.initializeLottieAnimations();
    });

    setTimeout(() => {
      this.checkScrollHint();
    }, 1000);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.checkScrollHint();
      });
    }
  }

  ngOnDestroy() {
    this.destroyLottieAnimations();
  }

  private logCurrentState() {
    console.log('📊 Current Data State:');
    console.log('   Projects:', this.projects.length, this.projects);
    console.log('   Medium Posts:', this.mediumPosts.length, this.mediumPosts);
    console.log('   Quora Posts:', this.quoraPosts.length, this.quoraPosts);
    console.log(
      '   LinkedIn Posts:',
      this.linkedinPosts.length,
      this.linkedinPosts
    );
    console.log('   Active Tab:', this.activeTab);

    // Additional debug for medium posts
    if (this.mediumPosts.length > 0) {
      console.log('🔍 Medium Post Details:', this.mediumPosts[0]);
      console.log('🔍 Medium Post Platform:', this.mediumPosts[0].platform);
    }
  }

  private destroyLottieAnimations() {
    this.lottieAnimations.forEach((animation) => {
      if (animation && typeof animation.destroy === 'function') {
        animation.destroy();
      }
    });
    this.lottieAnimations = [];
  }

  private initializeLottieAnimations() {
    this.destroyLottieAnimations();

    this.lottieContainers.forEach((container, index) => {
      let items: any[] = [];

      switch (this.activeTab) {
        case 'projects':
          items = this.projects;
          break;
        case 'medium':
          items = this.mediumPosts;
          break;
        case 'quora':
          items = this.quoraPosts;
          break;
        case 'linkedin':
          items = this.linkedinPosts;
          break;
      }

      const item = items[index];
      if (item && item.animationUrl) {
        try {
          const animation = lottie.loadAnimation({
            container: container.nativeElement,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: item.animationUrl,
          });
          this.lottieAnimations.push(animation);
        } catch (error) {
          console.warn('Failed to load Lottie animation:', error);
        }
      }
    });
  }

  // Tab change handler
  onTabChange(tabId: string) {
    console.log('🔁 Tab changing to:', tabId);
    this.activeTab = tabId;

    this.destroyLottieAnimations();
    this.cdRef.detectChanges();

    setTimeout(() => {
      this.initializeLottieAnimations();
      this.logCurrentState();
    }, 300);
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
      Java: 'fab fa-java',
      'Spring Boot': 'fas fa-leaf',
      PostgreSQL: 'fas fa-database',
      MySQL: 'fas fa-database',
      Docker: 'fab fa-docker',
      Jenkins: 'fab fa-jenkins',
      'REST APIs': 'fas fa-code',
      Microservices: 'fas fa-network-wired',
      Hibernate: 'fas fa-database',
      'Spring Data JPA': 'fas fa-database',
      'Spring Framework': 'fas fa-leaf',
      'AWS DevOps': 'fab fa-aws',
      Maven: 'fas fa-cogs',
      'Git/GitHub': 'fab fa-github',
      HTML: 'fab fa-html5',
      CSS: 'fab fa-css3-alt',
      JavaScript: 'fab fa-js-square',
    };

    return icons[tech] || 'fas fa-code';
  }

  addNewProject() {
    if (
      this.isEditMode &&
      this.newProject.title &&
      this.newProject.description
    ) {
      const project: Project = {
        id: Date.now(),
        title: this.newProject.title,
        description: this.newProject.description,
        technologies: this.newProject.technologies
          ? this.newProject.technologies.split(',').map((t) => t.trim())
          : ['Angular'],
        imageUrl:
          this.newProject.imageUrl || 'assets/images/project-placeholder.jpg',
        animationUrl:
          this.newProject.animationUrl ||
          'https://assets1.lottiefiles.com/packages/lf20_vybwn7df.json',
        link: this.newProject.link || '#',
        githubLink: this.newProject.githubLink,
        category: this.newProject.category || 'Web Application',
        featured: this.newProject.featured || false,
      };

      this.adminService.addProject(project);
      this.newProject = {};

      setTimeout(() => {
        this.initializeLottieAnimations();
      }, 100);
    }
  }

  deleteProject(project: Project, event: Event) {
    if (this.isEditMode) {
      event.preventDefault();
      event.stopPropagation();

      if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
        this.adminService.deleteProject(project.id);

        setTimeout(() => {
          this.initializeLottieAnimations();
        }, 100);
      }
    }
  }

  // TEST METHOD: Clear specific tab data for testing
  clearTabDataForTesting(tabName: string) {
    console.log('🧪 Clearing data for:', tabName);

    switch (tabName) {
      case 'projects':
        this.projects = [];
        break;
      case 'medium':
        this.mediumPosts = [];
        break;
      case 'quora':
        this.quoraPosts = [];
        break;
      case 'linkedin':
        this.linkedinPosts = [];
        break;
    }

    this.cdRef.detectChanges();
    console.log('✅ Data cleared for:', tabName);
    this.logCurrentState();
  }

  onTabsScroll(event: Event) {
    const container = event.target as HTMLElement;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    // Update scroll states
    this.isScrolledStart = scrollLeft === 0;
    this.isScrolledEnd = scrollLeft + clientWidth >= scrollWidth - 5; // 5px tolerance
    this.isScrolledMiddle = !this.isScrolledStart && !this.isScrolledEnd;
  }

  // Add this method to check if scroll hint should be shown
  checkScrollHint() {
    if (typeof window !== 'undefined') {
      const container = document.querySelector(
        '.tabs-container'
      ) as HTMLElement;
      if (container) {
        this.showScrollHint = container.scrollWidth > container.clientWidth;

        // Hide hint after 5 seconds
        if (this.showScrollHint) {
          setTimeout(() => {
            this.showScrollHint = false;
          }, 5000);
        }
      }
    }
  }
}