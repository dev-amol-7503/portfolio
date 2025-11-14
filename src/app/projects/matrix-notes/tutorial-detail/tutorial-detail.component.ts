import {
  Component,
  OnInit,
  HostListener,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { RoadmapStep, Tutorial } from '../../../interfaces/tutorial.model';
import { ToastrService } from 'ngx-toastr';

interface TableOfContentsItem {
  title: string;
  level: number;
  id: string;
}

@Component({
  selector: 'app-tutorial-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tutorial-detail.component.html',
  styleUrls: ['./tutorial-detail.component.scss'],
})
export class TutorialDetailComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  tutorial: Tutorial | null = null;
  isLoading = true;
  newComment = '';
  isBookmarked = false;
  hasLiked = false;
  showComments = false;
  showBackToTop = false;
  activeSectionId: string = '';

  // Topic navigation properties
  currentTopicIndex: number = 0;
  totalTopicsInStep: number = 0;
  allStepTutorials: Tutorial[] = [];

  private scrollListener: any;
  private intersectionObserver: IntersectionObserver | null = null;

  currentRoadmapStep: RoadmapStep | null = null;
  roadmapSteps: RoadmapStep[] = [];
  relatedTutorials: Tutorial[] = [];

  constructor(
    private matrixNotesService: MatrixNotesService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const tutorialId = this.route.snapshot.paramMap.get('id');
    const roadmapStepId = this.route.snapshot.queryParamMap.get('roadmapStep');

    if (tutorialId) {
      await this.loadTutorial(tutorialId);

      // Load roadmap context and related data
      await this.loadRoadmapContext(roadmapStepId);
      await this.loadAllStepTutorials();
      await this.loadRelatedTutorials();
      await this.checkLikeStatus(tutorialId);

      this.setupScrollListener();
    }
  }

  // Enhanced roadmap context loading
  async loadRoadmapContext(roadmapStepId: string | null) {
    try {
      console.log(`🔄 Loading roadmap context for step: ${roadmapStepId}`);

      if (roadmapStepId) {
        this.currentRoadmapStep = await this.getRoadmapStepById(
          parseInt(roadmapStepId)
        );
      } else if (this.tutorial?.roadmapStep) {
        this.currentRoadmapStep = await this.getRoadmapStepById(
          this.tutorial.roadmapStep
        );
      }

      this.roadmapSteps = await this.getAllRoadmapSteps();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error loading roadmap context:', error);
    }
  }

  // Get roadmap step by ID with proper tutorial mapping
  async getRoadmapStepById(stepId: number): Promise<RoadmapStep | null> {
    const allSteps = await this.getAllRoadmapSteps();
    const step = allSteps.find((step) => step.id === stepId);

    if (step && this.tutorial) {
      // Update step with current tutorial
      step.tutorials = [this.tutorial];
      console.log(
        `📚 Mapped tutorial to step ${stepId}: ${this.tutorial.title}`
      );
    }

    return step || null;
  }

  // Complete roadmap steps data
  async getAllRoadmapSteps(): Promise<RoadmapStep[]> {
    const backendSteps: RoadmapStep[] = [
      {
        id: 1,
        title: 'Java Fundamentals',
        description:
          'Master core Java concepts and modern features including Java 17/21 LTS',
        category: 'backend',
        technologies: [
          'Java 17',
          'Java 21',
          'OOP',
          'Collections',
          'Lambda',
          'Streams',
        ],
        topics: [
          'Java 17/21 LTS features',
          'Object-Oriented Programming',
          'Collections Framework',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 1,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 12,
        estimatedHours: 50,
      },
      {
        id: 2,
        title: 'Build Tools',
        description:
          'Master Maven and Gradle for project management, dependencies, and build automation',
        category: 'backend',
        technologies: [
          'Maven',
          'Gradle',
          'Build Tools',
          'Dependencies',
          'Plugins',
        ],
        topics: [
          'Project Structure',
          'Dependencies & Plugins',
          'Build Profiles',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 2,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 6,
        estimatedHours: 20,
      },
      {
        id: 3,
        title: 'Spring Core',
        description:
          'Dependency Injection, Bean Lifecycle, and Spring Framework fundamentals',
        category: 'backend',
        technologies: [
          'Spring Framework',
          'IoC',
          'DI',
          'ApplicationContext',
          'Auto Configuration',
        ],
        topics: [
          'IoC / Dependency Injection',
          'Bean Lifecycle',
          'ApplicationContext',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 3,
        badgeClass: 'core-badge',
        badgeText: 'Core',
        progressClass: 'backend-progress',
        totalTopics: 8,
        estimatedHours: 30,
      },
      {
        id: 4,
        title: 'Spring Boot 3.x',
        description:
          'Modern Spring Boot development with latest features and best practices',
        category: 'backend',
        technologies: [
          'Spring Boot 3.x',
          'Spring MVC',
          'Validation',
          'Actuator',
          'AOT',
        ],
        topics: [
          'Spring MVC Architecture',
          'Controllers & ControllerAdvice',
          'HTTP Status Codes',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 4,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 8,
        estimatedHours: 35,
      },
      {
        id: 5,
        title: 'Data Access & Persistence',
        description:
          'Database operations with Spring Data JPA, PostgreSQL, MySQL, and Redis',
        category: 'backend',
        technologies: [
          'Spring Data JPA',
          'PostgreSQL',
          'MySQL',
          'Redis',
          'Hibernate',
        ],
        topics: [
          'Spring Data JPA',
          'Entity Mapping & Relationships',
          'Query Methods & @Query',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 5,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 13,
        estimatedHours: 55,
      },
      {
        id: 6,
        title: 'RESTful APIs',
        description:
          'Build professional REST APIs with proper design patterns and best practices',
        category: 'backend',
        technologies: [
          'REST API',
          'Spring MVC',
          'DTOs',
          'MapStruct',
          'HATEOAS',
        ],
        topics: [
          'REST Design Principles',
          'Request/Response Models',
          'DTOs & Mappers (MapStruct)',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 6,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 9,
        estimatedHours: 35,
      },
      {
        id: 7,
        title: 'API Security',
        description:
          'Secure your applications with Spring Security, JWT, and OAuth2',
        category: 'backend',
        technologies: [
          'Spring Security',
          'JWT',
          'OAuth2',
          'OpenID Connect',
          'Keycloak',
        ],
        topics: [
          'Spring Security 6 Lambda DSL',
          'Roles & Authorities',
          'JWT Authentication',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 7,
        badgeClass: 'backend-badge',
        badgeText: 'Security',
        progressClass: 'backend-progress',
        totalTopics: 8,
        estimatedHours: 40,
      },
      {
        id: 8,
        title: 'Testing',
        description:
          'Comprehensive testing strategies with JUnit, Mockito, and Testcontainers',
        category: 'backend',
        technologies: [
          'JUnit 5',
          'Mockito',
          'Testcontainers',
          'Integration Testing',
        ],
        topics: ['JUnit 5', 'Mockito / MockBean', 'Spring Boot Test'],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 8,
        badgeClass: 'backend-badge',
        badgeText: 'Testing',
        progressClass: 'backend-progress',
        totalTopics: 7,
        estimatedHours: 30,
      },
      {
        id: 9,
        title: 'External API Clients',
        description:
          'Communicate with external APIs using RestTemplate, WebClient, and Feign',
        category: 'backend',
        technologies: ['RestTemplate', 'WebClient', 'Feign', 'Resilience4j'],
        topics: [
          'RestTemplate (Legacy)',
          'WebClient (Reactive)',
          'Feign Client',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 9,
        badgeClass: 'backend-badge',
        badgeText: 'Integration',
        progressClass: 'backend-progress',
        totalTopics: 6,
        estimatedHours: 25,
      },
      {
        id: 10,
        title: 'DevOps & Monitoring',
        description:
          'Deployment, monitoring, and DevOps practices for Spring Boot applications',
        category: 'backend',
        technologies: [
          'Docker',
          'Kubernetes',
          'Actuator',
          'Micrometer',
          'CI/CD',
        ],
        topics: [
          'Spring Boot Actuator',
          'Micrometer & Metrics',
          'Logging (Logback/SLF4J)',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 10,
        badgeClass: 'backend-badge',
        badgeText: 'DevOps',
        progressClass: 'backend-progress',
        totalTopics: 8,
        estimatedHours: 45,
      },
      {
        id: 11,
        title: 'Cloud & Deployment',
        description:
          'Deploy applications to cloud platforms and implement microservices architecture',
        category: 'backend',
        technologies: [
          'AWS',
          'Docker',
          'Kubernetes',
          'Microservices',
          'Spring Cloud',
        ],
        topics: ['Deploy to AWS/GCP/Azure', 'Container Registry', 'Kubernetes'],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 11,
        badgeClass: 'backend-badge',
        badgeText: 'Cloud',
        progressClass: 'backend-progress',
        totalTopics: 7,
        estimatedHours: 40,
      },
      {
        id: 12,
        title: 'Advanced Backend',
        description:
          'Advanced topics including reactive programming, messaging, and GraphQL',
        category: 'backend',
        technologies: [
          'Microservices',
          'WebFlux',
          'Kafka',
          'GraphQL',
          'Caching',
        ],
        topics: [
          'Microservices Architecture',
          'Service Discovery',
          'API Gateway',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 12,
        badgeClass: 'backend-badge',
        badgeText: 'Advanced',
        progressClass: 'backend-progress',
        totalTopics: 9,
        estimatedHours: 50,
      },
    ];

    const frontendSteps: RoadmapStep[] = [
      {
        id: 13,
        title: 'Web Fundamentals',
        description:
          'Master HTML5, CSS3, JavaScript ES6+, and TypeScript fundamentals',
        category: 'frontend',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'Git'],
        topics: [
          'HTML5 Semantic Elements',
          'CSS3 (Flexbox, Grid)',
          'JavaScript ES6+ Features',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 1,
        badgeClass: 'frontend-badge',
        badgeText: 'Frontend',
        progressClass: 'frontend-progress',
        totalTopics: 8,
        estimatedHours: 35,
      },
      {
        id: 14,
        title: 'Angular Core (v19)',
        description:
          'Modern Angular development with standalone components, signals, and latest features',
        category: 'frontend',
        technologies: [
          'Angular 19',
          'TypeScript',
          'Standalone',
          'Signals',
          'Zones',
        ],
        topics: [
          'Angular Architecture',
          'Standalone Components',
          'Modules vs Standalone APIs',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 2,
        badgeClass: 'frontend-badge',
        badgeText: 'Angular',
        progressClass: 'frontend-progress',
        totalTopics: 9,
        estimatedHours: 40,
      },
      {
        id: 15,
        title: 'Routing & Navigation',
        description:
          'Client-side routing, lazy loading, guards, and navigation in Angular',
        category: 'frontend',
        technologies: [
          'Angular Router',
          'Lazy Loading',
          'Guards',
          'Navigation',
        ],
        topics: [
          'RouterModule & Routes',
          'Route Parameters',
          'Query Parameters',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 3,
        badgeClass: 'frontend-badge',
        badgeText: 'Routing',
        progressClass: 'frontend-progress',
        totalTopics: 7,
        estimatedHours: 20,
      },
      {
        id: 16,
        title: 'Services & Dependency Injection',
        description:
          'Angular services, dependency injection, and RxJS for reactive programming',
        category: 'frontend',
        technologies: ['Services', 'DI', 'RxJS', 'Observables', 'Subjects'],
        topics: ['Injectable Services', 'Hierarchical DI', 'RxJS Observables'],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 4,
        badgeClass: 'frontend-badge',
        badgeText: 'Services',
        progressClass: 'frontend-progress',
        totalTopics: 7,
        estimatedHours: 25,
      },
      {
        id: 17,
        title: 'HTTP Communication',
        description:
          'HTTP client, interceptors, and API communication in Angular',
        category: 'frontend',
        technologies: ['HttpClient', 'Interceptors', 'API', 'CRUD'],
        topics: [
          'HttpClient Module',
          'CRUD Operations',
          'Request/Response Interceptors',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 5,
        badgeClass: 'frontend-badge',
        badgeText: 'HTTP',
        progressClass: 'frontend-progress',
        totalTopics: 7,
        estimatedHours: 25,
      },
      {
        id: 18,
        title: 'Authentication & Authorization',
        description:
          'JWT authentication, route protection, and role-based access in Angular',
        category: 'frontend',
        technologies: ['JWT', 'Auth Guards', 'Route Protection', 'Roles'],
        topics: ['JWT Integration', 'Login/Signup Flow', 'Auth Guards'],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 6,
        badgeClass: 'frontend-badge',
        badgeText: 'Auth',
        progressClass: 'frontend-progress',
        totalTopics: 7,
        estimatedHours: 25,
      },
      {
        id: 19,
        title: 'UI & Styling',
        description:
          'Modern UI development with Angular Material, Tailwind CSS, and responsive design',
        category: 'frontend',
        technologies: [
          'Angular Material',
          'Tailwind CSS',
          'SCSS',
          'Responsive',
        ],
        topics: [
          'Angular Material Components',
          'Tailwind CSS Setup',
          'SCSS & CSS Preprocessors',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 7,
        badgeClass: 'frontend-badge',
        badgeText: 'UI/UX',
        progressClass: 'frontend-progress',
        totalTopics: 7,
        estimatedHours: 30,
      },
      {
        id: 20,
        title: 'Testing',
        description:
          'Comprehensive testing strategies for Angular applications',
        category: 'frontend',
        technologies: ['Jasmine', 'Karma', 'Cypress', 'Testing'],
        topics: [
          'Unit Testing (Jasmine)',
          'Component Testing',
          'Service Testing',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 8,
        badgeClass: 'frontend-badge',
        badgeText: 'Testing',
        progressClass: 'frontend-progress',
        totalTopics: 6,
        estimatedHours: 20,
      },
      {
        id: 21,
        title: 'Build & Deployment',
        description:
          'Build optimization, environment configuration, and deployment strategies',
        category: 'frontend',
        technologies: [
          'Angular CLI',
          'Build Optimization',
          'Deployment',
          'AWS',
        ],
        topics: [
          'Angular CLI Commands',
          'Environment Configs',
          'Code Optimization',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 9,
        badgeClass: 'frontend-badge',
        badgeText: 'Deployment',
        progressClass: 'frontend-progress',
        totalTopics: 7,
        estimatedHours: 25,
      },
      {
        id: 22,
        title: 'Advanced Frontend',
        description:
          'Advanced Angular topics including state management, PWA, and performance',
        category: 'frontend',
        technologies: ['NgRx', 'Signals', 'PWA', 'SSR', 'Performance'],
        topics: [
          'State Management (NgRx)',
          'Signals Store',
          'Performance Optimization',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 10,
        badgeClass: 'frontend-badge',
        badgeText: 'Advanced',
        progressClass: 'frontend-progress',
        totalTopics: 7,
        estimatedHours: 50,
      },
    ];

    return [...backendSteps, ...frontendSteps];
  }

  // Load related tutorials from the same roadmap step
  async loadRelatedTutorials() {
    if (!this.currentRoadmapStep) return;

    try {
      const allTutorials = await this.matrixNotesService.getAllTutorials();
      this.relatedTutorials = allTutorials
        .filter(
          (tutorial) =>
            tutorial.roadmapStep === this.currentRoadmapStep?.id &&
            tutorial.id !== this.tutorial?.id &&
            tutorial.published
        )
        .slice(0, 5);
    } catch (error) {
      console.error('Error loading related tutorials:', error);
    }
  }

  // Navigate to a specific roadmap step
  navigateToRoadmapStep(stepId: number) {
    this.matrixNotesService
      .getTutorialByRoadmapStep(stepId)
      .then((tutorial) => {
        if (tutorial) {
          this.router.navigate(['/tutorials', tutorial.id], {
            queryParams: { roadmapStep: stepId },
          });
        } else {
          this.toastr.warning('No tutorial available for this step');
          this.router.navigate(['/tutorials'], {
            queryParams: { roadmapStep: stepId },
          });
        }
      })
      .catch(() => {
        this.toastr.warning('No tutorial available for this step');
        this.router.navigate(['/tutorials'], {
          queryParams: { roadmapStep: stepId },
        });
      });
  }

  // Get next roadmap step
  getNextRoadmapStep(): RoadmapStep | null {
    if (!this.currentRoadmapStep) return null;

    const currentIndex = this.roadmapSteps.findIndex(
      (step) => step.id === this.currentRoadmapStep?.id
    );
    return currentIndex < this.roadmapSteps.length - 1
      ? this.roadmapSteps[currentIndex + 1]
      : null;
  }

  // Get previous roadmap step
  getPreviousRoadmapStep(): RoadmapStep | null {
    if (!this.currentRoadmapStep) return null;

    const currentIndex = this.roadmapSteps.findIndex(
      (step) => step.id === this.currentRoadmapStep?.id
    );
    return currentIndex > 0 ? this.roadmapSteps[currentIndex - 1] : null;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupIntersectionObserver();
    }, 100);
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupScrollListener() {
    this.scrollListener = () => {
      this.showBackToTop = window.pageYOffset > 400;
    };
    window.addEventListener('scroll', this.scrollListener);
  }

  private setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.activeSectionId = entry.target.id;
        }
      });
    }, options);

    // Observe all content sections
    const contentBlocks = document.querySelectorAll('.content-section');
    contentBlocks.forEach((section) => {
      this.intersectionObserver?.observe(section);
    });
  }

  async loadTutorial(tutorialId: string) {
    try {
      this.isLoading = true;
      this.tutorial = await this.matrixNotesService.getTutorial(tutorialId);

      if (!this.tutorial) {
        this.router.navigate(['/tutorials']);
        return;
      }

      if (this.tutorial.published) {
        await this.matrixNotesService.incrementViews(tutorialId);
        this.tutorial.views = (this.tutorial.views || 0) + 1;
      }
    } catch (error) {
      console.error('Error loading tutorial:', error);
      this.router.navigate(['/tutorials']);
    } finally {
      this.isLoading = false;
    }
  }

  async checkLikeStatus(tutorialId: string) {
    try {
      // In a real app, you would check against user's liked tutorials
      this.hasLiked = false;
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  }

  async likeTutorial() {
    if (!this.tutorial) return;

    try {
      if (!this.hasLiked) {
        await this.matrixNotesService.incrementLikes(this.tutorial.id);
        this.tutorial.likes = (this.tutorial.likes || 0) + 1;
        this.hasLiked = true;
        this.toastr.success('Thanks for your like!');
      } else {
        this.toastr.info('You have already liked this tutorial');
      }
    } catch (error) {
      console.error('Error liking tutorial:', error);
      this.toastr.error('Failed to like tutorial');
    }
  }

  // Enhanced Table of Contents Methods
  getTableOfContents(): TableOfContentsItem[] {
    if (!this.tutorial) return [];

    const toc: TableOfContentsItem[] = [];
    let sectionCounter = 0;

    this.tutorial.content.forEach((content, index) => {
      if (content.type === 'text') {
        const lines = content.content.split('\n');

        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();

          // Match headings more flexibly
          const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const title = headingMatch[2].trim();

            // Create unique ID for this section
            const id = `section-${sectionCounter}`;

            toc.push({
              title: title,
              level: Math.min(level, 3), // Limit to max level 3 for TOC
              id: id,
            });

            sectionCounter++;
          }
        });
      }
    });

    // If no headings found, create TOC from content blocks
    if (toc.length === 0) {
      this.tutorial.content.forEach((content, index) => {
        if (content.type === 'text' && content.content.trim()) {
          const firstLine = content.content.split('\n')[0].trim();
          const title =
            firstLine.length > 50
              ? firstLine.substring(0, 50) + '...'
              : firstLine;

          toc.push({
            title: title || `Section ${index + 1}`,
            level: 1,
            id: `section-${index}`,
          });
        }
      });
    }

    return toc;
  }

  getSectionId(content: any, index: number): string {
    return `section-${index}`;
  }

  scrollToSection(sectionId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Update URL hash without scrolling
      history.replaceState(null, '', `#${sectionId}`);
      this.activeSectionId = sectionId;
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getScrollProgress(): number {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset;
    const trackLength = docHeight - winHeight;
    return Math.min(100, Math.floor((scrollTop / trackLength) * 100));
  }

  // Social sharing methods
  shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      `Check out this tutorial: ${this.tutorial?.title}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank'
    );
  }

  shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank'
    );
  }

  shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank'
    );
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.toastr.success('Link copied to clipboard');
    } catch (err) {
      this.toastr.error('Failed to copy link');
      console.error('Failed to copy link: ', err);
    }
  }

  // Code copying functionality
  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.toastr.success('Code copied to clipboard');
    } catch (err) {
      this.toastr.error('Failed to copy code');
      console.error('Failed to copy code: ', err);
    }
  }

  // Utility methods
  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'bg-success';
      case 'intermediate':
        return 'bg-warning';
      case 'advanced':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getAuthorInitials(author: string): string {
    return author
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getCurrentUserInitials(): string {
    return this.getCurrentUserName().charAt(0).toUpperCase();
  }

  getCurrentUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  getCurrentUserName(): string {
    return 'Current User';
  }

  getRandomColor(): string {
    const colors = [
      'primary',
      'success',
      'warning',
      'danger',
      'info',
      'purple',
      'pink',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Enhanced markdown rendering with better support
  renderEnhancedMarkdown(text: string): string {
    if (!text) return '';

    let html: string = text
      // Headers
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/gim, '<code class="inline-code">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Horizontal Rule
      .replace(/^---$/gim, '<hr>')
      // Images
      .replace(
        /!\[(.*?)\]\((.*?)\)/gim,
        '<img src="$2" alt="$1" class="img-fluid rounded">'
      )
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    return html;
  }

  renderVideo(url: string, title?: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeId(url);
      return `
        <div class="video-preview-content">
          ${title ? `<h4>${title}</h4>` : ''}
          <div class="video-container">
            <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
      `;
    } else if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `
        <div class="video-preview-content">
          ${title ? `<h4>${title}</h4>` : ''}
          <div class="video-container">
            <iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
      `;
    }
    return `<p><a href="${url}" target="_blank">${
      title || 'Watch Video'
    }</a></p>`;
  }

  renderCallout(content: string, type: string = 'info'): string {
    const icons: { [key: string]: string } = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      danger: 'fas fa-exclamation-circle',
      success: 'fas fa-check-circle',
      tip: 'fas fa-lightbulb',
    };

    // Use bracket notation to access the property
    const icon = icons[type] || icons['info'];
    return `
    <div class="callout callout-${type}">
      <div class="callout-icon">
        <i class="${icon}"></i>
      </div>
      <div class="callout-content">
        ${this.renderEnhancedMarkdown(content)}
      </div>
    </div>
  `;
  }

  getCalloutIcon(type: string = 'info'): string {
    const icons: { [key: string]: string } = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      danger: 'fas fa-exclamation-circle',
      success: 'fas fa-check-circle',
      tip: 'fas fa-lightbulb',
    };
    // Use bracket notation to access the property
    return icons[type] || icons['info'];
  }

  renderTable(content: string): string {
    const rows = content.split('\n').filter((row) => row.trim());
    if (rows.length === 0) return '';

    let html =
      '<div class="table-responsive"><table class="table table-striped">';
    rows.forEach((row, index) => {
      const cells = row.split(',').map((cell) => cell.trim());
      const tag = index === 0 ? 'th' : 'td';
      html += `<tr>${cells
        .map((cell) => `<${tag}>${cell}</${tag}>`)
        .join('')}</tr>`;
    });
    html += '</table></div>';
    return html;
  }

  renderContent(content: any): string {
    switch (content.type) {
      case 'text':
        return `<div class="rich-text-content">${this.renderEnhancedMarkdown(
          content.content
        )}</div>`;
      case 'code':
        const fileName = content.fileName
          ? `<div class="code-filename">${content.fileName}</div>`
          : '';
        return `
          <div class="code-block-preview">
            ${fileName}
            <pre data-language="${content.language}"><code class="language-${
          content.language
        }">${this.escapeHtml(content.content)}</code></pre>
          </div>
        `;
      case 'image':
        const caption = content.caption
          ? `<div class="image-caption">${content.caption}</div>`
          : '';
        return `
          <div class="image-block-preview">
            <img src="${content.content}" alt="${
          content.caption || 'Tutorial image'
        }" class="img-fluid rounded">
            ${caption}
          </div>
        `;
      case 'video':
        return this.renderVideo(content.content, content.title);
      case 'callout':
        return this.renderCallout(content.content, content.metadata?.type);
      case 'table':
        return this.renderTable(content.content);
      case 'diagram':
        return `<div class="diagram-preview-content">${this.renderEnhancedMarkdown(
          content.content
        )}</div>`;
      default:
        return content.content;
    }
  }

  // Private helper methods
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private extractYouTubeId(url: string): string {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : '';
  }

  // Load all tutorials for current roadmap step
  async loadAllStepTutorials() {
    if (!this.currentRoadmapStep) return;

    try {
      this.allStepTutorials =
        await this.matrixNotesService.getTutorialsByRoadmapStep(
          this.currentRoadmapStep.id
        );

      // Filter only published tutorials and sort by topicOrder
      this.allStepTutorials = this.allStepTutorials
        .filter((tutorial) => tutorial.published)
        .sort((a, b) => (a.topicOrder || 0) - (b.topicOrder || 0));

      this.totalTopicsInStep = this.allStepTutorials.length;

      // Find current tutorial's position
      if (this.tutorial) {
        this.currentTopicIndex = this.allStepTutorials.findIndex(
          (t) => t.id === this.tutorial!.id
        );

        // If not found, set to 0
        if (this.currentTopicIndex === -1) {
          this.currentTopicIndex = 0;
        }
      }

      console.log(
        `📚 Loaded ${this.totalTopicsInStep} tutorials for step ${this.currentRoadmapStep.id}`
      );
      console.log(
        `📍 Current position: ${this.currentTopicIndex + 1} of ${
          this.totalTopicsInStep
        }`
      );
    } catch (error) {
      console.error('Error loading step tutorials:', error);
      this.totalTopicsInStep = 0;
      this.currentTopicIndex = 0;
    }
  }

  // Navigate to next topic
  async navigateToNextTopic() {
    if (this.hasNextTopic()) {
      const nextTutorial = this.allStepTutorials[this.currentTopicIndex + 1];
      await this.navigateToTutorial(
        nextTutorial.id,
        this.currentRoadmapStep!.id
      );
    } else {
      this.toastr.info('🎉 You have completed all topics in this step!');

      // Optional: Navigate to next roadmap step
      const nextStep = this.getNextRoadmapStep();
      if (nextStep) {
        this.toastr.info(`Moving to next step: ${nextStep.title}`);
        this.navigateToRoadmapStep(nextStep.id);
      }
    }
  }

  // Navigate to previous topic
  async navigateToPreviousTopic() {
    if (this.hasPreviousTopic()) {
      const prevTutorial = this.allStepTutorials[this.currentTopicIndex - 1];
      await this.navigateToTutorial(
        prevTutorial.id,
        this.currentRoadmapStep!.id
      );
    } else {
      this.toastr.info('📚 This is the first topic in this step!');
    }
  }

  // Navigate to tutorial
  async navigateToTutorial(tutorialId: string, roadmapStepId: number) {
    console.log(
      `🚀 Navigating to tutorial: ${tutorialId} for step: ${roadmapStepId}`
    );

    this.router.navigate(['/tutorials', tutorialId], {
      queryParams: { roadmapStep: roadmapStepId },
    });
  }

  // Progress and navigation helpers
  getStepProgress(): number {
    if (!this.totalTopicsInStep) return 0;
    return Math.round(
      ((this.currentTopicIndex + 1) / this.totalTopicsInStep) * 100
    );
  }

  getCurrentTopicNumber(): number {
    return this.currentTopicIndex + 1;
  }

  hasNextTopic(): boolean {
    return this.currentTopicIndex < this.totalTopicsInStep - 1;
  }

  hasPreviousTopic(): boolean {
    return this.currentTopicIndex > 0;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.showBackToTop = window.pageYOffset > 400;
  }
}