import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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
  imports: [CommonModule, FormsModule],
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
  currentTextAreaIndex: number = -1;
  showSaveStatus = false;
  saveStatus: 'saved' | 'saving' | 'error' = 'saved';

  // Content types
  contentTypes = [
    {
      value: 'text',
      label: 'Text',
      icon: 'fas fa-paragraph',
      description: 'Rich text content with formatting',
    },
    {
      value: 'code',
      label: 'Code',
      icon: 'fas fa-code',
      description: 'Code snippets with syntax highlighting',
    },
    {
      value: 'image',
      label: 'Image',
      icon: 'fas fa-image',
      description: 'Images with captions',
    },
    {
      value: 'video',
      label: 'Video',
      icon: 'fas fa-video',
      description: 'Embedded video content',
    },
    {
      value: 'table',
      label: 'Table',
      icon: 'fas fa-table',
      description: 'Structured data tables',
    },
  ];

  popularContentTypes = this.contentTypes.slice(0, 3);
  programmingLanguages = [
    'html',
    'css',
    'typescript',
    'javascript',
    'java',
    'python',
    'sql',
  ];

  // Roadmap steps
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

    this.initializeRoadmapSteps();

    const tutorialId = this.route.snapshot.paramMap.get('id');
    if (tutorialId) {
      this.loadTutorial(tutorialId);
    }

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

  private getEmptyTutorial(): Tutorial {
    return {
      id: '',
      title: '',
      description: '',
      content: [],
      tags: [],
      category: 'java',
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
      learningObjectives: [
        'Understand the core concepts',
        'Learn practical implementation',
      ],
    };
  }

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

  // CONTENT EDITING METHODS
  addContentBlock() {
    const baseContent: TutorialContent = {
      id: Date.now().toString(),
      type: this.activeContentType as any,
      content: '',
      order: this.tutorial.content.length,
      showPreview: false,
    };

    const typeDefaults: { [key: string]: Partial<TutorialContent> } = {
      code: {
        language: 'typescript',
        fileName: '',
        ...baseContent,
      },
      image: {
        caption: '',
        altText: '',
        ...baseContent,
      },
      video: {
        title: '',
        ...baseContent,
      },
      table: {
        rows: 3,
        columns: 3,
        ...baseContent,
      },
    };

    const newContent = typeDefaults[this.activeContentType] || baseContent;
    this.tutorial.content.push(newContent as TutorialContent);
  }

  removeContentBlock(index: number) {
    if (confirm('Are you sure you want to delete this content block?')) {
      this.tutorial.content.splice(index, 1);
      this.updateContentOrder();
    }
  }

  moveBlockUp(index: number) {
    if (index > 0) {
      [this.tutorial.content[index - 1], this.tutorial.content[index]] = [
        this.tutorial.content[index],
        this.tutorial.content[index - 1],
      ];
      this.updateContentOrder();
    }
  }

  moveBlockDown(index: number) {
    if (index < this.tutorial.content.length - 1) {
      [this.tutorial.content[index], this.tutorial.content[index + 1]] = [
        this.tutorial.content[index + 1],
        this.tutorial.content[index],
      ];
      this.updateContentOrder();
    }
  }

  updateContentOrder() {
    this.tutorial.content.forEach((content, index) => {
      content.order = index;
    });
  }

  // Update content from contenteditable div
  updateContentFromEditor(index: number) {
    const editor = document.getElementById(`text-editor-${index}`);
    if (editor) {
      this.tutorial.content[index].content = editor.innerHTML;
    }
  }

  // Handle tab key in contenteditable - FIXED TYPE
  handleTabKey(event: KeyboardEvent, index: number) {
    if (event.key === 'Tab') {
      event.preventDefault();
      this.execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;', index);
    }
  }

  // Get plain text from HTML (for word count)
  getPlainText(html: string): string {
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  // Get word count for HTML content
  getWordCountFromHtml(html: string): number {
    const plainText = this.getPlainText(html);
    return this.getWordCount(plainText);
  }

  // Get word count for text
  getWordCount(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }

  // IMAGE HANDLING
  handleImageUpload(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tutorial.content[index].content = e.target.result;
        this.tutorial.content[index].altText = file.name;
      };
      reader.readAsDataURL(file);
    }
  }

  // VIDEO EMBED
  embedVideo(url: string, index: number) {
    let videoHTML = '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeId(url);
      videoHTML = `<div class="video-embed">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" allowfullscreen></iframe>
      </div>`;
    } else {
      videoHTML = `<div class="video-embed">
        <video controls width="100%">
          <source src="${url}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>`;
    }

    this.execCommand('insertHTML', videoHTML, index);
  }

  private extractYouTubeId(url: string): string {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : '';
  }

  // PREVIEW AND SAVE METHODS
  togglePreview() {
    this.previewMode = !this.previewMode;
    if (this.previewMode) {
      this.calculateReadingTime();
    }
  }

  toggleTextPreview(index: number) {
    this.tutorial.content[index].showPreview =
      !this.tutorial.content[index].showPreview;
  }

  async saveDraft() {
    await this.saveTutorial(false);
  }

  async publishTutorial() {
    if (!this.validateTutorial()) return;
    await this.saveTutorial(true);
  }

  private validateTutorial(): boolean {
    if (!this.tutorial.title?.trim()) {
      this.toastr.error('Please add a title before publishing');
      return false;
    }
    if (!this.tutorial.description?.trim()) {
      this.toastr.error('Please add a description before publishing');
      return false;
    }
    if (this.tutorial.content.length === 0) {
      this.toastr.error('Please add some content before publishing');
      return false;
    }
    return true;
  }

  private async saveTutorial(publish: boolean = false) {
    this.isSaving = true;
    this.showSaveStatus = true;
    this.saveStatus = 'saving';

    try {
      this.prepareTutorialForSave();

      let tutorialId: string;
      if (this.isEditMode) {
        await this.matrixNotesService.updateTutorial(
          this.tutorial.id,
          this.tutorial
        );
        tutorialId = this.tutorial.id;
      } else {
        tutorialId = await this.matrixNotesService.createTutorial(
          this.tutorial
        );
        this.tutorial.id = tutorialId;
        this.isEditMode = true;
      }

      if (publish) {
        await this.matrixNotesService.publishTutorial(tutorialId);
        this.tutorial.published = true;
        this.toastr.success('Tutorial published successfully!');

        setTimeout(() => {
          this.router.navigate(['/tutorials', tutorialId]);
        }, 1500);
      } else {
        this.saveStatus = 'saved';
        this.toastr.success('Draft saved successfully');
      }
    } catch (error) {
      this.saveStatus = 'error';
      this.toastr.error(
        publish ? 'Failed to publish tutorial' : 'Failed to save draft'
      );
      console.error('Save error:', error);
    } finally {
      this.isSaving = false;
      setTimeout(() => {
        this.showSaveStatus = false;
      }, 3000);
    }
  }

  private prepareTutorialForSave() {
    this.tutorial.updatedAt = new Date();
    this.tutorial.readingTime = this.calculateReadingTime();

    this.tutorial.technologies = this.tutorial.technologies || [];
    this.tutorial.tags = this.tutorial.tags || [];
    this.tutorial.prerequisites = this.tutorial.prerequisites || [];
    this.tutorial.learningObjectives = this.tutorial.learningObjectives || [];
  }

  private async autoSave() {
    if (this.tutorial.title || this.tutorial.content.length > 0) {
      try {
        this.prepareTutorialForSave();
        if (this.isEditMode) {
          await this.matrixNotesService.updateTutorial(this.tutorial.id, {
            ...this.tutorial,
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }

  // UTILITY METHODS
  getContentBlocksCount(type: string): number {
    return this.tutorial.content.filter((content) => content.type === type)
      .length;
  }

  getActiveContentTypeLabel(): string {
    const type = this.contentTypes.find(
      (t) => t.value === this.activeContentType
    );
    return type?.label || 'Content';
  }

  getLanguageDisplayName(lang: string): string {
    const names: { [key: string]: string } = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      springboot: 'Spring Boot',
    };
    return names[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  getSaveStatusText(): string {
    switch (this.saveStatus) {
      case 'saved':
        return 'All changes saved';
      case 'saving':
        return 'Saving changes...';
      case 'error':
        return 'Failed to save';
      default:
        return '';
    }
  }

  calculateReadingTime(): number {
    const wordCount = this.tutorial.content
      .filter((content) => content.type === 'text')
      .reduce((count, content) => {
        // Strip HTML tags and count words
        const text = this.getPlainText(content.content);
        return count + this.getWordCount(text);
      }, 0);

    const codeBlocks = this.tutorial.content.filter(
      (content) => content.type === 'code'
    ).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200) + codeBlocks);
    this.tutorial.readingTime = readingTime;
    return readingTime;
  }

  getContentIcon(type: string): string {
    const contentType = this.contentTypes.find((ct) => ct.value === type);
    return contentType?.icon || 'fas fa-question';
  }

  async loadTutorial(tutorialId: string) {
    try {
      const tutorial = await this.matrixNotesService.getTutorial(tutorialId);
      if (tutorial) {
        this.tutorial = {
          ...tutorial,
          technologies: tutorial.technologies || [],
          prerequisites: tutorial.prerequisites || [],
          learningObjectives: tutorial.learningObjectives || [],
        };
        this.isEditMode = true;
        this.toastr.success('Tutorial loaded successfully');
      }
    } catch (error) {
      this.toastr.error('Failed to load tutorial');
      console.error('Error loading tutorial:', error);
    }
  }

  // TAG AND TECHNOLOGY METHODS
  addTechnology(tech: string) {
    this.addToArray('technologies', tech);
  }

  addTag(tag: string) {
    this.addToArray('tags', tag);
  }

  addPrerequisite(prereq: string) {
    this.addToArray('prerequisites', prereq);
  }

  private addToArray(
    arrayName: 'technologies' | 'tags' | 'prerequisites',
    value: string
  ) {
    if (value && value.trim()) {
      if (!this.tutorial[arrayName]) {
        this.tutorial[arrayName] = [];
      }
      const trimmedValue = value.trim();
      if (!this.tutorial[arrayName]!.includes(trimmedValue)) {
        this.tutorial[arrayName]!.push(trimmedValue);
      }
    }
  }

  removeTechnology(index: number) {
    this.tutorial.technologies?.splice(index, 1);
  }

  removeTag(index: number) {
    this.tutorial.tags?.splice(index, 1);
  }

  removePrerequisite(index: number) {
    this.tutorial.prerequisites?.splice(index, 1);
  }

  // LEARNING OBJECTIVES
  getLearningObjectives(): string[] {
    return this.tutorial.learningObjectives || [];
  }

  addLearningObjective() {
    if (!this.tutorial.learningObjectives) {
      this.tutorial.learningObjectives = [];
    }
    this.tutorial.learningObjectives.push('');
  }

  updateLearningObjective(index: number, value: string) {
    if (
      this.tutorial.learningObjectives &&
      this.tutorial.learningObjectives.length > index
    ) {
      this.tutorial.learningObjectives[index] = value;
    }
  }

  removeLearningObjective(index: number) {
    if (
      this.tutorial.learningObjectives &&
      this.tutorial.learningObjectives.length > index
    ) {
      this.tutorial.learningObjectives.splice(index, 1);
    }
  }

  onRoadmapStepChange(stepId: number | undefined): void {
    if (!stepId) return;

    const selectedStep = this.roadmapSteps.find((step) => step.id === stepId);
    if (selectedStep) {
      if (!this.tutorial.technologies) this.tutorial.technologies = [];
      if (!this.tutorial.tags) this.tutorial.tags = [];
      if (!this.tutorial.learningObjectives)
        this.tutorial.learningObjectives = [];

      this.tutorial.technologies = [...selectedStep.technologies];
      this.tutorial.tags = [
        ...selectedStep.technologies,
        ...selectedStep.topics.slice(0, 3),
      ];
      this.tutorial.category = selectedStep.category;
      this.tutorial.learningObjectives = selectedStep.topics.slice(0, 5);
    }
  }

  // CONTENT RENDERING FOR PREVIEW
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
            <pre><code class="language-${
              content.language || 'text'
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
          content.altText || 'Tutorial image'
        }" class="img-fluid rounded">
            ${caption}
          </div>
        `;
      case 'video':
        return content.content;
      case 'table':
        return content.content;
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

  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.toastr.success('Code copied to clipboard');
    } catch (err) {
      this.toastr.error('Failed to copy code');
      console.error('Failed to copy code: ', err);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.tutorial.title || this.tutorial.content.length > 0) {
      event.preventDefault();
      event.returnValue =
        'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  // Add these methods to your MatrixNotesEditorComponent class

  // Handle format block change
  handleFormatBlockChange(event: Event, index: number) {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.execCommand('formatBlock', target.value, index);
    }
  }

  // Show prompt for link URL
  showLinkPrompt(index: number) {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) {
      this.execCommand('createLink', url, index);
    }
  }

  // Show prompt for video URL
  showVideoPrompt(index: number) {
    const url = window.prompt('Enter video URL:', 'https://');
    if (url) {
      this.embedVideo(url, index);
    }
  }

  // Handle tab key with specific event type
  handleEditorTabKey(event: KeyboardEvent, index: number) {
    if (event.key === 'Tab') {
      event.preventDefault();
      this.execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;', index);
    }
  }

  // Enhanced execCommand method that preserves cursor position
  execCommand(command: string, value: string = '', index: number) {
    const editor = document.getElementById(
      `text-editor-${index}`
    ) as HTMLElement;
    if (!editor) return;

    // Save current selection before executing command
    this.saveSelection(editor);

    // Focus the editor
    editor.focus();

    // Execute the command
    document.execCommand(command, false, value);

    // Restore selection after command
    this.restoreSelection(editor);

    // Update content
    this.updateContentFromEditor(index);
  }

  // Save current selection
  private saveSelection(editor: HTMLElement) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(editor);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const start = preSelectionRange.toString().length;
    const end = start + range.toString().length;

    // Store selection in data attributes
    editor.setAttribute('data-selection-start', start.toString());
    editor.setAttribute('data-selection-end', end.toString());
  }

  // Restore saved selection
  private restoreSelection(editor: HTMLElement) {
    const start = parseInt(editor.getAttribute('data-selection-start') || '0');
    const end = parseInt(editor.getAttribute('data-selection-end') || '0');

    // Clear attributes
    editor.removeAttribute('data-selection-start');
    editor.removeAttribute('data-selection-end');

    if (start === 0 && end === 0) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();

    try {
      // Find the text node and offset for the given position
      const pos = this.findTextNodeAndOffset(editor, start);
      if (pos.node) {
        range.setStart(pos.node, pos.offset);

        const endPos = this.findTextNodeAndOffset(editor, end);
        if (endPos.node) {
          range.setEnd(endPos.node, endPos.offset);
        } else {
          range.setEnd(pos.node, pos.offset);
        }

        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.warn('Could not restore selection:', error);
      // Fallback: set cursor to end
      this.setCursorToEnd(editor);
    }
  }

  // Helper method to find text node and offset
  private findTextNodeAndOffset(
    element: Node,
    position: number
  ): { node: Node | null; offset: number } {
    let currentPos = 0;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent?.length || 0;
      if (position <= currentPos + nodeLength) {
        return {
          node: node,
          offset: position - currentPos,
        };
      }
      currentPos += nodeLength;
    }

    return { node: null, offset: 0 };
  }

  // Fallback method to set cursor to end
  private setCursorToEnd(editor: HTMLElement) {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false); // false means collapse to end

    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Enhanced keyboard handler for nested lists
  onKeyDown(event: KeyboardEvent, index: number) {
    const editor = document.getElementById(
      `text-editor-${index}`
    ) as HTMLElement;
    if (!editor) return;

    // Handle Tab key for nested lists
    if (event.key === 'Tab') {
      event.preventDefault();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const li = this.findParentListItem(range.startContainer);

      if (li) {
        if (event.shiftKey) {
          // Shift+Tab - Outdent (remove nested list)
          this.outdentListItem(li);
        } else {
          // Tab - Indent (create nested list)
          this.indentListItem(li);
        }
        this.updateContentFromEditor(index);
      } else {
        // Regular tab behavior
        this.execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;', index);
      }
      return;
    }

    // Handle Enter key for nested lists
    if (event.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const li = this.findParentListItem(range.startContainer);

      if (li && range.startOffset === 0 && range.endOffset === 0) {
        // Enter at beginning of list item - create new list item above
        event.preventDefault();
        this.createNewListItemAbove(li, index);
        return;
      }

      if (li) {
        // Check if we're at the end of the list item
        const liContent = li.textContent || '';
        const cursorPosition = this.getCursorPositionInElement(li, range);

        if (cursorPosition >= liContent.length) {
          // Enter at end of list item - create new list item below
          event.preventDefault();
          this.createNewListItemBelow(li, index);
          return;
        }
      }
    }

    // Keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          this.execCommand('bold', '', index);
          break;
        case 'i':
          event.preventDefault();
          this.execCommand('italic', '', index);
          break;
        case 'u':
          event.preventDefault();
          this.execCommand('underline', '', index);
          break;
      }
    }
  }

  // Helper method to find parent list item
  private findParentListItem(node: Node): HTMLLIElement | null {
    let current = node;
    while (current && current.nodeName !== 'LI') {
      current = current.parentNode as Node;
      if (
        !current ||
        current.nodeName === 'DIV' ||
        current.nodeName === 'BODY'
      ) {
        return null;
      }
    }
    return current as HTMLLIElement;
  }

  // Indent list item (create nested list)
  private indentListItem(li: HTMLLIElement) {
    const previousLi = li.previousElementSibling as HTMLLIElement;
    if (!previousLi) return;

    let nestedList = previousLi.querySelector('ul, ol') as
      | HTMLUListElement
      | HTMLOListElement;

    if (!nestedList) {
      // Create new nested list
      nestedList = document.createElement(
        li.parentElement?.nodeName === 'OL' ? 'ol' : 'ul'
      );
      previousLi.appendChild(nestedList);
    }

    // Move current li to nested list
    nestedList.appendChild(li);
  }

  // Outdent list item (remove from nested list)
  private outdentListItem(li: HTMLLIElement) {
    const nestedList = li.parentElement;
    const parentList = nestedList?.parentElement;

    if (
      !nestedList ||
      !parentList ||
      !(nestedList.nodeName === 'UL' || nestedList.nodeName === 'OL')
    ) {
      return;
    }

    // Move li to parent list
    const parentListElement = parentList.parentElement;
    if (
      parentListElement &&
      (parentListElement.nodeName === 'UL' ||
        parentListElement.nodeName === 'OL')
    ) {
      parentListElement.insertBefore(li, parentList.nextSibling);

      // Remove empty nested list
      if (nestedList.children.length === 0) {
        parentList.removeChild(nestedList);
      }
    }
  }

  // Create new list item above current one
  private createNewListItemAbove(li: HTMLLIElement, index: number) {
    const newLi = document.createElement('li');
    newLi.innerHTML = '&nbsp;';

    const list = li.parentElement;
    if (list) {
      list.insertBefore(newLi, li);

      // Set cursor in new list item
      setTimeout(() => {
        const editor = document.getElementById(
          `text-editor-${index}`
        ) as HTMLElement;
        if (editor) {
          this.setCursorInElement(newLi, editor);
        }
      }, 0);
    }
  }

  // Create new list item below current one
  private createNewListItemBelow(li: HTMLLIElement, index: number) {
    const newLi = document.createElement('li');
    newLi.innerHTML = '&nbsp;';

    const list = li.parentElement;
    if (list) {
      list.insertBefore(newLi, li.nextSibling);

      // Set cursor in new list item
      setTimeout(() => {
        const editor = document.getElementById(
          `text-editor-${index}`
        ) as HTMLElement;
        if (editor) {
          this.setCursorInElement(newLi, editor);
        }
      }, 0);
    }
  }

  // Get cursor position within an element
  private getCursorPositionInElement(element: Node, range: Range): number {
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  // Set cursor inside an element
  private setCursorInElement(element: HTMLElement, editor: HTMLElement) {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true); // true means collapse to start

    selection.removeAllRanges();
    selection.addRange(range);

    editor.focus();
  }

  // Handle paste event
  handlePaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      this.execCommand('insertText', text, index);
    }
  }

  // Add these methods to your component class

  // Enhanced table creation with caption and styling
  createTable(
    rows: number = 3,
    cols: number = 3,
    index: number,
    tableName?: string
  ) {
    const editor = document.getElementById(
      `text-editor-${index}`
    ) as HTMLElement;
    if (!editor) return;

    // Save selection before creating table
    this.saveSelection(editor);

    let tableHTML = `
    <div class="table-container">
      ${
        tableName
          ? `<div class="table-caption">${this.escapeHtml(tableName)}</div>`
          : ''
      }
      <table class="custom-table" border="1">
        <thead>
          <tr>
  `;

    // Create table header
    for (let j = 0; j < cols; j++) {
      tableHTML += `<th style="padding: 8px; border: 1px solid #ccc; background: #f8f9fa;">Header ${
        j + 1
      }</th>`;
    }
    tableHTML += `</tr></thead><tbody>`;

    // Create table rows
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += `<td style="padding: 8px; border: 1px solid #ccc;">Content ${
          i + 1
        }-${j + 1}</td>`;
      }
      tableHTML += '</tr>';
    }

    tableHTML += `</tbody></table></div><br>`;

    // Insert table at current cursor position
    this.execCommand('insertHTML', tableHTML, index);
  }

  // Show table creation dialog with name input
  showTableCreationDialog(index: number) {
    const rows = this.tutorial.content[index].rows || 3;
    const cols = this.tutorial.content[index].columns || 3;

    // Create modal dialog for table creation
    const tableName = window.prompt('Enter table name/caption (optional):', '');
    const confirmCreate = window.confirm(
      `Create table with ${rows} rows and ${cols} columns?`
    );

    if (confirmCreate) {
      this.createTable(rows, cols, index, tableName || '');
    }
  }

  // Enhanced table editing methods
  addTableRow(table: HTMLTableElement) {
    const row = table.insertRow();
    const colCount = table.rows[0].cells.length;

    for (let i = 0; i < colCount; i++) {
      const cell = row.insertCell();
      cell.style.padding = '8px';
      cell.style.border = '1px solid #ccc';
      cell.innerHTML = '&nbsp;';
    }
  }

  deleteTableRow(table: HTMLTableElement) {
    if (table.rows.length > 1) {
      table.deleteRow(table.rows.length - 1);
    }
  }

  addTableColumn(table: HTMLTableElement) {
    for (let i = 0; i < table.rows.length; i++) {
      const cell = table.rows[i].insertCell();
      cell.style.padding = '8px';
      cell.style.border = '1px solid #ccc';
      cell.innerHTML =
        i === 0
          ? `<strong>Header ${table.rows[0].cells.length}</strong>`
          : '&nbsp;';
    }
  }

  deleteTableColumn(table: HTMLTableElement) {
    if (table.rows[0].cells.length > 1) {
      for (let i = 0; i < table.rows.length; i++) {
        table.rows[i].deleteCell(table.rows[i].cells.length - 1);
      }
    }
  }

  // Table context menu and editing
  setupTableEditing(index: number) {
    const editor = document.getElementById(
      `text-editor-${index}`
    ) as HTMLElement;
    if (!editor) return;

    // Add click handler for table operations
    editor.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.tagName === 'TD' || target.tagName === 'TH') {
        this.showTableContextMenu(target, event, index);
      }
    });
  }

  // Show context menu for table editing
  private showTableContextMenu(
    cell: HTMLElement,
    event: MouseEvent,
    index: number
  ) {
    event.preventDefault();

    const table = this.findParentTable(cell);
    if (!table) return;

    // Remove existing context menu
    this.removeTableContextMenu();

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'table-context-menu';
    contextMenu.style.cssText = `
    position: fixed;
    left: ${event.clientX}px;
    top: ${event.clientY}px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    padding: 8px;
    min-width: 150px;
  `;

    const menuItems = [
      { text: 'Add Row', action: () => this.addTableRow(table) },
      { text: 'Delete Row', action: () => this.deleteTableRow(table) },
      { text: 'Add Column', action: () => this.addTableColumn(table) },
      { text: 'Delete Column', action: () => this.deleteTableColumn(table) },
      {
        text: 'Edit Caption',
        action: () => this.editTableCaption(table, index),
      },
    ];

    menuItems.forEach((item) => {
      const menuItem = document.createElement('div');
      menuItem.textContent = item.text;
      menuItem.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 3px;
    `;
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#f0f0f0';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });
      menuItem.addEventListener('click', () => {
        item.action();
        this.removeTableContextMenu();
        this.updateContentFromEditor(index);
      });
      contextMenu.appendChild(menuItem);
    });

    document.body.appendChild(contextMenu);

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener(
        'click',
        this.removeTableContextMenu.bind(this),
        { once: true }
      );
    }, 0);
  }

  private removeTableContextMenu() {
    const existingMenu = document.querySelector('.table-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  private findParentTable(element: HTMLElement): HTMLTableElement | null {
    let current = element;
    while (current && current.tagName !== 'TABLE') {
      current = current.parentElement as HTMLElement;
      if (!current || current.tagName === 'DIV' || current.tagName === 'BODY') {
        return null;
      }
    }
    return current as HTMLTableElement;
  }

  // Edit table caption
  editTableCaption(table: HTMLTableElement, index: number) {
    const tableContainer = table.parentElement;
    if (
      !tableContainer ||
      !tableContainer.classList.contains('table-container')
    )
      return;

    let caption = tableContainer.querySelector('.table-caption') as HTMLElement;
    const currentCaption = caption?.textContent || '';

    const newCaption = window.prompt('Enter table caption:', currentCaption);
    if (newCaption !== null) {
      if (!caption) {
        caption = document.createElement('div');
        caption.className = 'table-caption';
        tableContainer.insertBefore(caption, table);
      }
      caption.textContent = newCaption;
      this.updateContentFromEditor(index);
    }
  }

  // Enhanced table styling
  applyTableStyles() {
    // This will be called when initializing editor content
    const tables = document.querySelectorAll('.custom-table');
    tables.forEach((table) => {
      this.styleTable(table as HTMLTableElement);
    });
  }

  private styleTable(table: HTMLTableElement) {
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '16px 0';

    // Style header cells
    const headers = table.querySelectorAll('th');
    headers.forEach((header) => {
      header.style.backgroundColor = '#f8f9fa';
      header.style.fontWeight = 'bold';
      header.style.textAlign = 'left';
      header.style.padding = '12px';
      header.style.border = '1px solid #dee2e6';
    });

    // Style data cells
    const cells = table.querySelectorAll('td');
    cells.forEach((cell) => {
      cell.style.padding = '12px';
      cell.style.border = '1px solid #dee2e6';
      cell.style.verticalAlign = 'top';
    });
  }

  // Update initEditorContent to apply table styles
  initEditorContent(index: number) {
    const editor = document.getElementById(`text-editor-${index}`);
    if (editor && this.tutorial.content[index].content) {
      editor.innerHTML = this.tutorial.content[index].content;
      // Apply table styles after content is loaded
      setTimeout(() => {
        this.applyTableStyles();
        this.setupTableEditing(index);
      }, 0);
    }
  }
}
