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
import { QuillModule } from 'ngx-quill';

import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { QuillConfigService } from '../../../services/quill-config.service';
import {
  RoadmapStep,
  Tutorial,
  TutorialContent,
} from '../../../interfaces/tutorial.model';
import { AdminService } from '../../../services/admin.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-matrix-notes-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './matrix-notes-editor.component.html',
  styleUrls: ['./matrix-notes-editor.component.scss'],
})
export class MatrixNotesEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editor!: ElementRef;

  tutorial: Tutorial = this.getEmptyTutorial();
  isEditMode = false;
  isSaving = false;
  isLoading = false;
  autoSaveInterval: any;
  showSaveStatus = false;
  saveStatus: 'saved' | 'saving' | 'error' = 'saved';

  // Store main content separately for the single editor
  mainContent: string = '';

  // Quill configuration
  quillConfig: any;

  // Categories
  categories = [
    { value: 'git', label: 'Git & Version Control', icon: 'fab fa-git-alt' },
    { value: 'angular', label: 'Angular', icon: 'fab fa-angular' },
    { value: 'typescript', label: 'TypeScript', icon: 'fas fa-code' },
    { value: 'javascript', label: 'JavaScript', icon: 'fab fa-js-square' },
    { value: 'html-css', label: 'HTML & CSS', icon: 'fab fa-html5' },
    { value: 'spring-boot', label: 'Spring Boot', icon: 'fas fa-leaf' },
    { value: 'java', label: 'Java', icon: 'fab fa-java' },
    { value: 'database', label: 'Database', icon: 'fas fa-database' },
    { value: 'devops', label: 'DevOps', icon: 'fas fa-cloud' },
    { value: 'general', label: 'General Programming', icon: 'fas fa-cogs' }
  ];

  // Difficulties
  difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'success', description: 'Easy to follow for newcomers' },
    { value: 'intermediate', label: 'Intermediate', color: 'warning', description: 'Requires some programming knowledge' },
    { value: 'advanced', label: 'Advanced', color: 'danger', description: 'For experienced developers' }
  ];

  // Roadmap steps
  roadmapSteps: RoadmapStep[] = [];
  backendSteps: RoadmapStep[] = [];
  frontendSteps: RoadmapStep[] = [];

  constructor(
    private matrixNotesService: MatrixNotesService,
    private quillConfigService: QuillConfigService,
    public adminService: AdminService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.quillConfig = this.quillConfigService.getQuillConfig();
  }

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
    } else {
      this.initializeContent();
    }

    this.autoSaveInterval = setInterval(() => {
      if (this.tutorial.title || this.mainContent) {
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

  private initializeContent() {
    if (this.tutorial.content.length === 0) {
      this.tutorial.content.push({
        id: 'main-content',
        type: 'text',
        content: '',
        order: 0,
        showPreview: false,
      });
    }
    this.mainContent = this.tutorial.content[0]?.content || '';
  }

  // DEVELOPER SOLUTION INTEGRATION METHODS
  cancel() {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/admin/tutorials']);
    }
  }

  getDifficultyColor(difficulty: string): string {
    const diff = this.difficulties.find(d => d.value === difficulty);
    return diff?.color || 'secondary';
  }

  getDifficultyDescription(difficulty: string): string {
    const diff = this.difficulties.find(d => d.value === difficulty);
    return diff?.description || 'Programming solution';
  }

  getSolutionReadTime(): number {
    return this.calculateReadingTime();
  }

  getContentWordCount(): number {
    return this.getWordCount(this.mainContent);
  }

  // CONTENT EDITOR METHODS FOR SINGLE EDITOR
  onContentChange() {
    if (this.tutorial.content.length === 0) {
      this.tutorial.content.push({
        id: 'main-content',
        type: 'text',
        content: this.mainContent,
        order: 0,
        showPreview: false,
      });
    } else {
      this.tutorial.content[0].content = this.mainContent;
    }
    this.calculateReadingTime();
  }

  // SAVE METHODS
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
    if (!this.mainContent?.trim()) {
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

    // Ensure main content is saved to tutorial content
    if (this.tutorial.content.length === 0) {
      this.tutorial.content.push({
        id: 'main-content',
        type: 'text',
        content: this.mainContent,
        order: 0,
        showPreview: false,
      });
    } else {
      this.tutorial.content[0].content = this.mainContent;
    }

    this.tutorial.technologies = this.tutorial.technologies || [];
    this.tutorial.tags = this.tutorial.tags || [];
    this.tutorial.prerequisites = this.tutorial.prerequisites || [];
    this.tutorial.learningObjectives = this.tutorial.learningObjectives || [];
  }

  private async autoSave() {
    if (this.tutorial.title || this.mainContent) {
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
    const wordCount = this.getWordCount(this.mainContent);
    const codeBlocks = (this.mainContent?.match(/<pre class="ql-syntax"/g) || []).length;
    const readingTime = Math.max(1, Math.ceil((wordCount / 200) + (codeBlocks * 2)));
    this.tutorial.readingTime = readingTime;
    return readingTime;
  }

  async loadTutorial(tutorialId: string) {
    this.isLoading = true;
    try {
      const tutorial = await this.matrixNotesService.getTutorial(tutorialId);
      if (tutorial) {
        this.tutorial = {
          ...tutorial,
          technologies: tutorial.technologies || [],
          prerequisites: tutorial.prerequisites || [],
          learningObjectives: tutorial.learningObjectives || [],
        };
        
        // Load main content from the first content block
        if (this.tutorial.content.length > 0) {
          this.mainContent = this.tutorial.content[0].content;
        } else {
          this.initializeContent();
        }
        
        this.isEditMode = true;
        this.toastr.success('Tutorial loaded successfully');
      }
    } catch (error) {
      this.toastr.error('Failed to load tutorial');
      console.error('Error loading tutorial:', error);
    } finally {
      this.isLoading = false;
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

  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.toastr.success('Code copied to clipboard');
    } catch (err) {
      this.toastr.error('Failed to copy code');
      console.error('Failed to copy code: ', err);
    }
  }

  // Get word count for text
  getWordCount(text: string): number {
    if (!text || !text.trim()) return 0;
    
    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.split(/\s+/).length;
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.tutorial.title || this.mainContent) {
      event.preventDefault();
      event.returnValue =
        'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  // Add your existing initializeRoadmapSteps() method here
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
}