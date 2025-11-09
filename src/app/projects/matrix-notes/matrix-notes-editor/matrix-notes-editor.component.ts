import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import {
  RoadmapStep,
  Tutorial,
  TutorialContent,
} from '../../../interfaces/tutorial.model';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-matrix-notes-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag],
  templateUrl: './matrix-notes-editor.component.html',
  styleUrls: ['./matrix-notes-editor.component.scss'],
})
export class MatrixNotesEditorComponent implements OnInit, OnDestroy {
  @ViewChild('contentEditable') contentEditable!: ElementRef;

  tutorial: Tutorial = this.getEmptyTutorial();
  isEditMode = false;
  isSaving = false;
  autoSaveInterval: any;
  previewMode = false;
  activeContentType: string = 'text';
  currentTextBlockIndex: number = -1;

  currentTextAreaIndex: number = -1;
  textAreaElements: { [key: number]: ElementRef } = {};

  // Available content types
  contentTypes = [
    { value: 'text', label: 'Text', icon: 'fas fa-paragraph' },
    { value: 'code', label: 'Code', icon: 'fas fa-code' },
    { value: 'image', label: 'Image', icon: 'fas fa-image' },
    { value: 'video', label: 'Video', icon: 'fas fa-video' },
    { value: 'diagram', label: 'Diagram', icon: 'fas fa-project-diagram' },
    { value: 'callout', label: 'Callout', icon: 'fas fa-quote-left' },
    { value: 'table', label: 'Table', icon: 'fas fa-table' },
  ];

  programmingLanguages = [
    'html',
    'css',
    'scss',
    'typescript',
    'javascript',
    'java',
    'spring',
    'springboot',
    'hibernate',
    'jpa',
    'restapi',
    'microservices',
  ];

  // Roadmap steps for selection
  roadmapSteps: RoadmapStep[] = [];
  backendSteps: RoadmapStep[] = [];
  frontendSteps: RoadmapStep[] = [];

  constructor(
    private matrixNotesService: MatrixNotesService,
    public adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.adminService.isAdmin$.subscribe((isAdmin) => {
      if (!isAdmin) {
        this.router.navigate(['/admin/login']);
        return;
      }
    });

    // Initialize roadmap steps
    this.initializeRoadmapSteps();

    // Check if editing existing tutorial
    const tutorialId = this.route.snapshot.paramMap.get('id');
    if (tutorialId) {
      this.loadTutorial(tutorialId);
    }

    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      if (this.tutorial.title || this.tutorial.content.length > 0) {
        this.autoSave();
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  // FIXED: Initialize tutorial with proper optional properties
  private getEmptyTutorial(): Tutorial {
    return {
      id: '',
      title: '',
      description: '',
      content: [],
      tags: [],
      category: 'web-development',
      author: 'admin',
      published: false,
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      readingTime: 5,
      difficulty: 'beginner',
      bookmarks: [],
      views: 0,
      likes: 0,
      roadmapStep: undefined,
      technologies: [],
      prerequisites: [],
      learningObjectives: [],
    };
  }

  // Toggle preview with proper typing
  public togglePreview1(index: number) {
    this.previewMode = !this.previewMode;
    if (!this.tutorial.content[index].showPreview) {
      this.tutorial.content[index].showPreview = true;
    } else {
      this.tutorial.content[index].showPreview = false;
    }
  }

  // FIXED: Initialize roadmap steps
  private initializeRoadmapSteps() {
    this.backendSteps = [
      {
        id: 1,
        title: 'Java Fundamentals',
        description:
          'Master core Java concepts and modern features including Java 17/21 LTS, OOP, Collections, Streams API, and Multithreading',
        category: 'backend',
        technologies: [
          'Java 17',
          'Java 21',
          'OOP',
          'Collections',
          'Lambda',
          'Streams',
          'Multithreading',
          'Virtual Threads',
        ],
        topics: [
          'Java 17/21 LTS features',
          'Object-Oriented Programming',
          'Collections Framework',
          'Streams API & Parallel Streams',
          'Exception Handling',
          'Multithreading & Concurrency',
          'Records, Sealed Classes',
          'Pattern Matching',
          'Text Blocks & Switch Expressions',
          'Functional Programming',
          'Java Module System',
          'Virtual Threads (Project Loom)',
        ],
        tutorials: [],
        isActive: true,
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
          'Multi-module Projects',
          'Spring Boot Plugin',
          'Maven vs Gradle',
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
          'Java-based Configuration',
          'Spring Boot Auto Configuration',
          'Conditional Beans',
          'Starter Dependencies',
          'Lombok Integration',
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
          'Validation (Jakarta)',
          'Configuration Properties',
          'Profiles & Environment',
          'Actuator & Health Checks',
          'AOT Compilation',
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
          'DTO & Projection',
          'Lazy/Eager Loading',
          'Transactions',
          'Pagination & Sorting',
          'Flyway / Liquibase',
          'Spring Data JDBC',
          'Redis Cache',
          'MongoDB',
          'Testcontainers',
          'R2DBC',
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
          'Pagination, Sorting, Filtering',
          'Exception Handling',
          'Global Error Handler',
          'File Upload/Download',
          'Versioning APIs',
          'HATEOAS',
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
          'OAuth2 / OpenID Connect',
          'Filters & Custom Authentication',
          'Keycloak / Auth0 Integration',
          'CSRF, CORS & Security Headers',
          'Password Encoders',
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
        topics: [
          'JUnit 5',
          'Mockito / MockBean',
          'Spring Boot Test',
          'Integration Tests',
          'RestAssured',
          'Test Slices',
          'Contract Testing',
        ],
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
          'Retry Mechanism',
          'Circuit Breaker',
          'Unit & Integration Testing',
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
          'Centralized Logging',
          'Dockerize Spring Apps',
          'CI/CD Pipelines',
          'Prometheus + Grafana',
          'Config Server',
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
        topics: [
          'Deploy to AWS/GCP/Azure',
          'Container Registry',
          'Kubernetes',
          'Serverless',
          'Spring Cloud Config',
          'Service Discovery',
          'Microservices Architecture',
        ],
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
          'Reactive Programming',
          'WebFlux & Reactor',
          'Messaging (RabbitMQ, Kafka)',
          'GraphQL with Spring Boot',
          'Caching Strategies',
          'Observability',
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

    this.frontendSteps = [
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
          'TypeScript Fundamentals',
          'Interfaces & Generics',
          'Async/Await & Promises',
          'Decorators',
          'Basic Git & Version Control',
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
          'Components & Templates',
          'Data Binding',
          'Directives (ngIf, ngFor)',
          'Pipes (built-in & custom)',
          'Signals (Angular 16+)',
          'Zone-less Change Detection',
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
          'Lazy Loading',
          'Route Guards',
          'Preloading Strategies',
          'Route Resolvers',
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
        topics: [
          'Injectable Services',
          'Hierarchical DI',
          'RxJS Observables',
          'Subjects & BehaviorSubjects',
          'Common Operators',
          'Error Handling',
          'Reactive Patterns',
        ],
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
          'JWT & Logging Interceptors',
          'Environment Configuration',
          'API Versioning',
          'Error Handling',
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
        topics: [
          'JWT Integration',
          'Login/Signup Flow',
          'Auth Guards',
          'Route Protection',
          'Role-based UI',
          'Refresh Tokens',
          'Persistent Auth State',
        ],
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
          'Responsive Design',
          'Angular Animations',
          'Custom Themes',
          'Reusable Components',
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
          'HttpTestingController',
          'E2E Testing (Cypress)',
          'Test Best Practices',
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
          'AOT Compilation',
          'Bundle Analyzer',
          'Deployment Platforms',
          'AWS S3 + CloudFront',
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
          'Progressive Web Apps',
          'SSR & SSG (Angular Universal)',
          'Monorepos with Nx',
          'Internationalization',
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
    this.roadmapSteps = [...this.backendSteps, ...this.frontendSteps];
  }

  // FIXED: Handle roadmap step change with proper type checking
  onRoadmapStepChange(stepId: number | undefined): void {
    if (!stepId) return;

    const selectedStep = this.roadmapSteps.find((step) => step.id === stepId);
    if (selectedStep) {
      // Initialize arrays if they don't exist
      if (!this.tutorial.technologies) this.tutorial.technologies = [];
      if (!this.tutorial.tags) this.tutorial.tags = [];
      if (!this.tutorial.learningObjectives)
        this.tutorial.learningObjectives = [];

      // Auto-populate technologies and tags from roadmap step
      this.tutorial.technologies = [...selectedStep.technologies];
      this.tutorial.tags = [
        ...selectedStep.technologies,
        ...selectedStep.topics.slice(0, 3),
      ];
      this.tutorial.category = selectedStep.category;

      // Add learning objectives based on roadmap step topics
      this.tutorial.learningObjectives = selectedStep.topics.slice(0, 5);
    }
  }

  // FIXED: Technology methods
  addTechnology(tech: string): void {
    if (tech && tech.trim()) {
      if (!this.tutorial.technologies) {
        this.tutorial.technologies = [];
      }
      if (!this.tutorial.technologies.includes(tech.trim())) {
        this.tutorial.technologies.push(tech.trim());
      }
    }
  }

  removeTechnology(index: number): void {
    if (
      this.tutorial.technologies &&
      this.tutorial.technologies.length > index
    ) {
      this.tutorial.technologies.splice(index, 1);
    }
  }

  // FIXED: Prerequisite methods
  addPrerequisite(prereq: string): void {
    if (prereq && prereq.trim()) {
      if (!this.tutorial.prerequisites) {
        this.tutorial.prerequisites = [];
      }
      if (!this.tutorial.prerequisites.includes(prereq.trim())) {
        this.tutorial.prerequisites.push(prereq.trim());
      }
    }
  }

  removePrerequisite(index: number): void {
    if (
      this.tutorial.prerequisites &&
      this.tutorial.prerequisites.length > index
    ) {
      this.tutorial.prerequisites.splice(index, 1);
    }
  }

  // FIXED: Get roadmap step name
  getRoadmapStepName(stepId: number | undefined): string {
    if (!stepId) return 'Not assigned';
    const step = this.roadmapSteps.find((s) => s.id === stepId);
    return step ? step.title : 'Unknown step';
  }

  // Get all roadmap steps for dropdown
  getRoadmapSteps(): RoadmapStep[] {
    return this.roadmapSteps;
  }

  // Get steps by category
  getStepsByCategory(category: string): RoadmapStep[] {
    return this.roadmapSteps.filter((step) => step.category === category);
  }

  // ... rest of your existing methods (loadTutorial, addContentBlock, removeContentBlock, etc.) ...

  async loadTutorial(tutorialId: string) {
    try {
      const tutorial = await this.matrixNotesService.getTutorial(tutorialId);
      if (tutorial) {
        // Ensure optional arrays are initialized
        this.tutorial = {
          ...tutorial,
          technologies: tutorial.technologies || [],
          prerequisites: tutorial.prerequisites || [],
          learningObjectives: tutorial.learningObjectives || [],
        };
        this.isEditMode = true;
      }
    } catch (error) {
      this.toastr.error('Failed to load tutorial');
    }
  }

  addContentBlock() {
    const newContent: TutorialContent = {
      id: Date.now().toString(),
      type: this.activeContentType as any,
      content: '',
      order: this.tutorial.content.length,
      language: this.activeContentType === 'code' ? 'javascript' : '',
      fileName: this.activeContentType === 'code' ? '' : '',
      caption: this.activeContentType === 'image' ? '' : '',
      title: this.activeContentType === 'video' ? '' : '',
      metadata: this.activeContentType === 'callout' ? { type: 'info' } : {},
      showPreview: false,
    };

    this.tutorial.content.push(newContent);
  }

  removeContentBlock(index: number) {
    this.tutorial.content.splice(index, 1);
    this.updateContentOrder();
  }

  updateContentOrder() {
    this.tutorial.content.forEach((content, index) => {
      content.order = index;
    });
  }

  dropContent(event: CdkDragDrop<TutorialContent[]>) {
    moveItemInArray(
      this.tutorial.content,
      event.previousIndex,
      event.currentIndex
    );
    this.updateContentOrder();
  }

  addTag(tag: string) {
    if (tag && !this.tutorial.tags.includes(tag)) {
      this.tutorial.tags.push(tag);
    }
  }

  removeTag(index: number) {
    this.tutorial.tags.splice(index, 1);
  }

  async saveDraft() {
    this.isSaving = true;
    try {
      if (this.isEditMode) {
        await this.matrixNotesService.updateTutorial(
          this.tutorial.id,
          this.tutorial
        );
        this.toastr.success('Draft saved successfully');
      } else {
        const tutorialId = await this.matrixNotesService.createTutorial(
          this.tutorial
        );
        this.tutorial.id = tutorialId;
        this.isEditMode = true;
        this.toastr.success('Draft saved successfully');
      }
    } catch (error) {
      this.toastr.error('Failed to save draft');
    } finally {
      this.isSaving = false;
    }
  }

  async autoSave() {
    if (
      this.isEditMode &&
      (this.tutorial.title || this.tutorial.content.length > 0)
    ) {
      try {
        await this.matrixNotesService.updateTutorial(this.tutorial.id, {
          ...this.tutorial,
          updatedAt: new Date(),
        });
        console.log('Auto-saved tutorial');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }

  calculateReadingTime(): number {
    const wordCount = this.tutorial.content
      .filter((content) => content.type === 'text')
      .reduce((count, content) => count + content.content.split(' ').length, 0);

    return Math.max(1, Math.ceil(wordCount / 200));
  }

  getContentIcon(type: string): string {
    const contentType = this.contentTypes.find((ct) => ct.value === type);
    return contentType?.icon || 'fas fa-question';
  }

  editTutorial(tutorialId: string) {
    this.router.navigate(['/admin/matrix-notes/editor', tutorialId]);
  }

  // Method to handle image upload
  async onImageUpload(event: any, contentIndex: number) {
    const file = event.target.files[0];
    if (file) {
      // In a real app, you would upload to Firebase Storage
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tutorial.content[contentIndex].content = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Enhanced renderContent method
  renderContent(content: TutorialContent): string {
    switch (content.type) {
      case 'text':
        return `<div class="rich-text-content">${content.content}</div>`;
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
        return `<div class="diagram-preview-content">${this.renderMarkdown(
          content.content
        )}</div>`;
      default:
        return content.content;
    }
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private renderVideo(url: string, title?: string): string {
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
    }
    return `<p><a href="${url}" target="_blank">${
      title || 'Watch Video'
    }</a></p>`;
  }

  private extractYouTubeId(url: string): string {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : '';
  }

  private renderCallout(content: string, type: string = 'info'): string {
    const icons = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      danger: 'fas fa-exclamation-circle',
      success: 'fas fa-check-circle',
      tip: 'fas fa-lightbulb',
    };

    const icon = icons[type as keyof typeof icons] || icons.info;
    return `
      <div class="callout callout-${type}">
        <div class="callout-icon">
          <i class="${icon}"></i>
        </div>
        <div class="callout-content">
          ${this.renderMarkdown(content)}
        </div>
      </div>
    `;
  }

  private renderTable(content: string): string {
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

  // Table preview for editor
  renderTablePreview(content: string): string {
    return this.renderTable(content);
  }

  // Add this method to handle metadata updates
  updateCalloutType(content: TutorialContent, type: string) {
    if (!content.metadata) {
      content.metadata = {};
    }
    content.metadata.type = type;
  }

  // Enhanced paste handling for rich text
  onTextPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    this.currentTextBlockIndex = index;

    const text =
      event.clipboardData?.getData('text/html') ||
      event.clipboardData?.getData('text/plain');

    if (text) {
      // Clean and preserve formatting
      const cleanHtml = this.cleanPastedHtml(text);
      document.execCommand('insertHTML', false, cleanHtml);

      // Update content
      const textEditor = event.target as HTMLElement;
      this.tutorial.content[index].content = textEditor.innerHTML;
    }
  }

  private cleanPastedHtml(html: string): string {
    // Remove unwanted tags but preserve basic formatting
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '');

    return cleanHtml;
  }

  // Enhanced text editor methods
  getTextContent(index: number): string {
    const content = this.tutorial.content[index].content;
    return content && content.trim() !== '' ? content : '<p><br></p>';
  }

  onTextEditorBlur() {
    console.log('Text editor blurred');
    // Keep the current index for a short time to allow toolbar interactions
    setTimeout(() => {
      this.currentTextBlockIndex = -1;
    }, 150);
  }

  onTextEditorClick(index: number) {
    console.log('Text editor clicked:', index);
    this.currentTextBlockIndex = index;

    // Ensure the editor gets focus
    const textEditors = document.querySelectorAll('.text-editor');
    if (textEditors[index]) {
      (textEditors[index] as HTMLElement).focus();
    }
  }

  onTextEditorKeydown(index: number, event: KeyboardEvent) {
    this.currentTextBlockIndex = index;
  }

  onTextContentChange(index: number, event: any) {
    const newContent = event.target.innerHTML;
    this.tutorial.content[index].content = newContent;
    console.log('Content updated for block:', index, newContent);
  }

  // Enhanced formatting with better focus management
  formatText(command: string, index: number, event?: any) {
    console.log('Formatting text:', command, 'for block:', index);

    // Store the current index
    this.currentTextBlockIndex = index;

    // Get the specific text editor
    const textEditors = document.querySelectorAll('.text-editor');
    if (textEditors[index]) {
      const textEditor = textEditors[index] as HTMLElement;

      // Focus on the editor first
      textEditor.focus();

      // Small delay to ensure focus is set
      setTimeout(() => {
        this.executeFormatCommand(command, event, textEditor);

        // Update the content model
        this.tutorial.content[index].content = textEditor.innerHTML;
      }, 10);
    }
  }

  private executeFormatCommand(
    command: string,
    event: any,
    textEditor: HTMLElement
  ) {
    try {
      // Ensure we're still focused on the correct editor
      textEditor.focus();

      switch (command) {
        case 'bold':
          document.execCommand('bold', false, undefined);
          break;
        case 'italic':
          document.execCommand('italic', false, undefined);
          break;
        case 'underline':
          document.execCommand('underline', false, undefined);
          break;
        case 'bullet':
          document.execCommand('insertUnorderedList', false, undefined);
          break;
        case 'number':
          document.execCommand('insertOrderedList', false, undefined);
          break;
        case 'heading':
          const heading = event?.target?.value;
          if (heading) {
            document.execCommand('formatBlock', false, `<${heading}>`);
          } else {
            document.execCommand('formatBlock', false, '<p>');
          }
          break;
        case 'fontSize':
          const size = event?.target?.value;
          if (size) {
            document.execCommand('fontSize', false, size);
          }
          break;
        case 'alignLeft':
          document.execCommand('justifyLeft', false, undefined);
          break;
        case 'alignCenter':
          document.execCommand('justifyCenter', false, undefined);
          break;
        case 'alignRight':
          document.execCommand('justifyRight', false, undefined);
          break;
        case 'alignJustify':
          document.execCommand('justifyFull', false, undefined);
          break;
      }
    } catch (error) {
      console.error('Error executing format command:', error);
    }
  }

  public renderMarkdown(text: string): string {
    if (!text) return '';

    let html = text
      // Headers
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // Lists
      .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/^(\d+)\. (.*$)/gim, '<ol><li>$2</li></ol>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    // Fix list formatting
    html = html.replace(/<\/ul><br><ul>/gim, '');
    html = html.replace(/<\/ol><br><ol>/gim, '');

    return html;
  }

  @ViewChild('textArea', { static: false }) set textAreaRef(ref: ElementRef) {
    if (ref && this.currentTextAreaIndex !== -1) {
      this.textAreaElements[this.currentTextAreaIndex] = ref;
    }
  }

  onTextEditorFocus(index: number) {
    this.currentTextAreaIndex = index;
  }

  // Handle keyboard shortcuts and tab key
  handleKeydown(event: KeyboardEvent, index: number) {
    this.currentTextAreaIndex = index;

    // Tab key handling
    if (event.key === 'Tab') {
      event.preventDefault();
      this.handleTabKey(event.shiftKey, index);
      return;
    }

    // Keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          this.insertMarkdown('bold', index);
          break;
        case 'i':
          event.preventDefault();
          this.insertMarkdown('italic', index);
          break;
        case 'k':
          event.preventDefault();
          this.insertMarkdown('link', index);
          break;
      }
    }
  }

  // Handle Tab and Shift+Tab for indentation with proper typing
  handleTabKey(isShift: boolean, index: number) {
    const textarea = this.textAreaElements[index]?.nativeElement;
    if (!textarea) return;

    const start: number = textarea.selectionStart;
    const end: number = textarea.selectionEnd;
    const value: string = textarea.value;

    if (isShift) {
      // Unindent (Shift+Tab)
      const beforeCursor: string = value.substring(0, start);
      const afterCursor: string = value.substring(end);
      const currentLineStart: number = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine: string = value.substring(currentLineStart, start);

      if (currentLine.startsWith('    ') || currentLine.startsWith('\t')) {
        const newValue: string =
          value.substring(0, currentLineStart) +
          currentLine.substring(currentLine.startsWith('    ') ? 4 : 1) +
          afterCursor;

        textarea.value = newValue;
        this.tutorial.content[index].content = newValue;

        const newPos: number = start - (currentLine.startsWith('    ') ? 4 : 1);
        textarea.setSelectionRange(newPos, newPos);
      }
    } else {
      // Indent (Tab)
      const newValue: string =
        value.substring(0, start) + '    ' + value.substring(end);
      textarea.value = newValue;
      this.tutorial.content[index].content = newValue;

      const newPos: number = start + 4;
      textarea.setSelectionRange(newPos, newPos);
    }
  }

  // Insert markdown formatting with proper typing
  insertMarkdown(type: string, index: number) {
    const textarea = this.textAreaElements[index]?.nativeElement;
    if (!textarea) return;

    const start: number = textarea.selectionStart;
    const end: number = textarea.selectionEnd;
    const value: string = textarea.value;
    const selectedText: string = value.substring(start, end);

    let newValue: string = '';
    let newCursorPos: number = start;

    switch (type) {
      case 'bold':
        newValue =
          value.substring(0, start) +
          `**${selectedText}**` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 2);
        break;

      case 'italic':
        newValue =
          value.substring(0, start) +
          `*${selectedText}*` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 1);
        break;

      case 'code':
        newValue =
          value.substring(0, start) +
          `\`${selectedText}\`` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 1);
        break;

      case 'bullet':
        if (selectedText) {
          const bulletedText: string = selectedText
            .split('\n')
            .map((line: string) => (line.trim() ? `- ${line}` : ''))
            .join('\n');
          newValue =
            value.substring(0, start) + bulletedText + value.substring(end);
        } else {
          newValue = value.substring(0, start) + `- ` + value.substring(end);
          newCursorPos = start + 2;
        }
        break;

      case 'number':
        if (selectedText) {
          const numberedText: string = selectedText
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string, idx: number) => `${idx + 1}. ${line}`)
            .join('\n');
          newValue =
            value.substring(0, start) + numberedText + value.substring(end);
        } else {
          newValue = value.substring(0, start) + `1. ` + value.substring(end);
          newCursorPos = start + 3;
        }
        break;

      case 'h1':
        newValue =
          value.substring(0, start) +
          `# ${selectedText || 'Heading 1'}` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 2);
        break;

      case 'h2':
        newValue =
          value.substring(0, start) +
          `## ${selectedText || 'Heading 2'}` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 3);
        break;

      case 'h3':
        newValue =
          value.substring(0, start) +
          `### ${selectedText || 'Heading 3'}` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 4);
        break;

      case 'quote':
        if (selectedText) {
          const quotedText: string = selectedText
            .split('\n')
            .map((line: string) => `> ${line}`)
            .join('\n');
          newValue =
            value.substring(0, start) + quotedText + value.substring(end);
        } else {
          newValue = value.substring(0, start) + `> ` + value.substring(end);
          newCursorPos = start + 2;
        }
        break;

      case 'link':
        newValue =
          value.substring(0, start) +
          `[${selectedText || 'link text'}](https://)` +
          value.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 3 : 12);
        break;

      case 'image':
        newValue =
          value.substring(0, start) +
          `![${selectedText || 'alt text'}](https://)` +
          value.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 4 : 13);
        break;

      case 'table':
        const table: string = `| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |`;
        newValue = value.substring(0, start) + table + value.substring(end);
        break;

      case 'hr':
        newValue = value.substring(0, start) + `\n---\n` + value.substring(end);
        newCursorPos = start + 5;
        break;

      default:
        console.warn('Unknown markdown type:', type);
        return;
    }

    textarea.value = newValue;
    this.tutorial.content[index].content = newValue;

    // Set cursor position
    setTimeout(() => {
      let newEndPos: number;
      if (selectedText) {
        switch (type) {
          case 'bold':
            newEndPos = newCursorPos + selectedText.length + 4;
            break;
          case 'italic':
            newEndPos = newCursorPos + selectedText.length + 2;
            break;
          default:
            newEndPos = newCursorPos + selectedText.length;
        }
      } else {
        newEndPos = newCursorPos;
      }

      textarea.setSelectionRange(newCursorPos, newEndPos);
      textarea.focus();
    }, 0);
  }

  // Text alignment with proper typing
  alignText(alignment: string, index: number) {
    const textarea = this.textAreaElements[index]?.nativeElement;
    if (!textarea) return;

    const start: number = textarea.selectionStart;
    const end: number = textarea.selectionEnd;
    const value: string = textarea.value;
    const selectedText: string = value.substring(start, end);

    if (selectedText) {
      let alignedText: string = '';

      switch (alignment) {
        case 'center':
          alignedText = `<div style="text-align: center">\n${selectedText}\n</div>`;
          break;
        case 'right':
          alignedText = `<div style="text-align: right">\n${selectedText}\n</div>`;
          break;
        case 'left':
        default:
          alignedText = `<div style="text-align: left">\n${selectedText}\n</div>`;
          break;
      }

      const newValue: string =
        value.substring(0, start) + alignedText + value.substring(end);
      textarea.value = newValue;
      this.tutorial.content[index].content = newValue;
    }
  }

  // Toggle preview with proper typing
  public toggleTextPreview(index: number) {
    if (!this.tutorial.content[index].showPreview) {
      this.tutorial.content[index].showPreview = true;
    } else {
      this.tutorial.content[index].showPreview = false;
    }
  }

  // Keep this one for global preview mode
  togglePreview() {
    this.previewMode = !this.previewMode;
  }

  // Enhanced markdown rendering with alignment support
  public renderEnhancedMarkdown(text: string): string {
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
        '<img src="$2" alt="$1" class="img-fluid">'
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

    // Handle alignment divs
    html = html.replace(
      /<div style="text-align: center">(.*?)<\/div>/gim,
      '<div style="text-align: center">$1</div>'
    );
    html = html.replace(
      /<div style="text-align: right">(.*?)<\/div>/gim,
      '<div style="text-align: right">$1</div>'
    );
    html = html.replace(
      /<div style="text-align: left">(.*?)<\/div>/gim,
      '<div style="text-align: left">$1</div>'
    );

    // Clean up multiple line breaks
    html = html.replace(/<br><br>/gim, '<br>');

    return html;
  }

  // FIXED: Safe getter for learning objectives
  getLearningObjectives(): string[] {
    return this.tutorial.learningObjectives || [];
  }

  // FIXED: Safe method to update learning objectives
  updateLearningObjective(index: number, value: string): void {
    if (!this.tutorial.learningObjectives) {
      this.tutorial.learningObjectives = [];
    }

    if (this.tutorial.learningObjectives.length > index) {
      this.tutorial.learningObjectives[index] = value;
    }
  }

  // FIXED: Learning objectives methods with safety checks
  addLearningObjective(): void {
    if (!this.tutorial.learningObjectives) {
      this.tutorial.learningObjectives = [];
    }
    this.tutorial.learningObjectives.push('');
  }

  removeLearningObjective(index: number): void {
    if (
      this.tutorial.learningObjectives &&
      this.tutorial.learningObjectives.length > index
    ) {
      this.tutorial.learningObjectives.splice(index, 1);
    }
  }

  // matrix-notes-editor.component.ts - PRODUCTION PUBLISH

  async publishTutorial(): Promise<void> {
    // Validation
    if (!this.tutorial.title?.trim()) {
      this.toastr.error('Please add a title before publishing');
      return;
    }

    if (this.tutorial.content.length === 0) {
      this.toastr.error('Please add some content before publishing');
      return;
    }

    this.isSaving = true;

    try {
      // Prepare tutorial data
      this.prepareTutorialForPublish();

      // Save tutorial
      const tutorialId = await this.saveTutorial();

      // Publish tutorial
      await this.matrixNotesService.publishTutorial(tutorialId);

      // Navigate to published tutorial
      this.navigateToPublishedTutorial(tutorialId);
    } catch (error) {
      console.error('❌ Failed to publish tutorial:', error);
      this.toastr.error('Failed to publish tutorial');
    } finally {
      this.isSaving = false;
    }
  }

  private prepareTutorialForPublish(): void {
    // Calculate reading time
    this.tutorial.readingTime = this.calculateReadingTime();

    // Set roadmap metadata
    if (this.tutorial.roadmapStep) {
      const selectedStep = this.roadmapSteps.find(
        (s) => s.id === this.tutorial.roadmapStep
      );
      if (selectedStep) {
        this.tutorial.roadmapType = selectedStep.category as
          | 'frontend'
          | 'backend';
        this.tutorial.stepTitle = selectedStep.title;
      }
    }

    // Ensure arrays are initialized
    this.tutorial.technologies = this.tutorial.technologies || [];
    this.tutorial.prerequisites = this.tutorial.prerequisites || [];
    this.tutorial.learningObjectives = this.tutorial.learningObjectives || [];
  }

  private async saveTutorial(): Promise<string> {
    if (this.isEditMode) {
      await this.matrixNotesService.updateTutorial(
        this.tutorial.id,
        this.tutorial
      );
      return this.tutorial.id;
    } else {
      return await this.matrixNotesService.createTutorial(this.tutorial);
    }
  }

  private navigateToPublishedTutorial(tutorialId: string): void {
    const queryParams = this.tutorial.roadmapStep
      ? { roadmapStep: this.tutorial.roadmapStep }
      : undefined;

    this.router.navigate(['/tutorials', tutorialId], { queryParams });
    this.toastr.success('Tutorial published successfully');
  }
}
