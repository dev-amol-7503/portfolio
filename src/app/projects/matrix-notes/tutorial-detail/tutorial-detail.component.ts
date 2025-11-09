import {
  Component,
  OnInit,
  HostListener,
  OnDestroy,
  AfterViewInit,
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

  // NEW: Topic navigation properties
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
    private toastr: ToastrService
  ) {}

// In the ngOnInit method, ensure proper loading order
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

  // FIXED: Load roadmap context with change detection fix
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

      // Trigger change detection manually if needed
      // this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error loading roadmap context:', error);
    }
  }

  // FIXED: Get roadmap step by ID with proper tutorial mapping
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

  // tutorial-detail.component.ts - FIX ROADMAP STEPS DATA

  // FIXED: Complete getAllRoadmapSteps method
  async getAllRoadmapSteps(): Promise<RoadmapStep[]> {
    // Return complete roadmap steps (backend + frontend)
    const backendSteps: RoadmapStep[] = [
      {
        id: 1,
        title: 'Java Fundamentals',
        description: 'Master core Java concepts...',
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
        description: 'Master Maven and Gradle for project management...',
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
      // Add all other backend steps (3-12)...
      {
        id: 3,
        title: 'Spring Core',
        description: 'Dependency Injection, Bean Lifecycle...',
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
      // Continue for steps 4-12...
    ];

    const frontendSteps: RoadmapStep[] = [
      {
        id: 13,
        title: 'Web Fundamentals',
        description: 'Master HTML5, CSS3, JavaScript ES6+...',
        category: 'frontend',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'Git'],
        topics: [
          'HTML5 Semantic Elements',
          'CSS3 (Flexbox, Grid)',
          'JavaScript ES6+ Features',
          'TypeScript Fundamentals',
          'Interfaces & Generics',
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
        description: 'Modern Angular development...',
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
      // Add all other frontend steps (15-22)...
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
            tutorial.id !== this.tutorial?.id
        )
        .slice(0, 5);
    } catch (error) {
      console.error('Error loading related tutorials:', error);
    }
  }

  // Navigate to a specific roadmap step
  navigateToRoadmapStep(stepId: number) {
    // Find tutorial for this step
    this.matrixNotesService
      .getTutorialByRoadmapStep(stepId)
      .then((tutorial) => {
        if (tutorial) {
          // Navigate to the tutorial for this step
          this.router.navigate(['/tutorials', tutorial.id], {
            queryParams: { roadmapStep: stepId },
          });
        } else {
          this.toastr.warning('No tutorial available for this step');
          // Navigate back to tutorials list filtered by this step
          this.router.navigate(['/tutorials'], {
            queryParams: { roadmapStep: stepId },
          });
        }
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
    // Small timeout to ensure DOM is fully rendered
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
    const contentBlocks = document.querySelectorAll('.content-block');
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
      }
    } catch (error) {
      console.error('Error loading tutorial:', error);
      this.router.navigate(['/tutorials']);
    } finally {
      this.isLoading = false;
    }
  }

  async checkLikeStatus(tutorialId: string) {
    const userId = this.getCurrentUserId();
    try {
      this.hasLiked = false;
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  }

  async likeTutorial() {
    if (!this.tutorial) return;

    const userId = this.getCurrentUserId();
    try {
      if (!this.hasLiked) {
        await this.matrixNotesService.incrementLikes(this.tutorial.id);
        this.tutorial.likes = (this.tutorial.likes || 0) + 1;
        this.hasLiked = true;
      }
    } catch (error) {
      console.error('Error liking tutorial:', error);
    }
  }

  // FIXED Table of Contents Methods
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

    return toc;
  }

  getSectionId(content: any, index: number): string {
    // Simple ID based on index - this ensures consistency
    return `section-${index}`;
  }

  scrollToSection(sectionId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }

    const element = document.getElementById(sectionId);
    if (element) {
      // Calculate offset for fixed headers
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
      console.log('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  }

  // Code copying functionality
  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      console.log('Code copied to clipboard');
    } catch (err) {
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

  // Content rendering methods
  renderMarkdown(text: string): string {
    return text
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(
        /!\[(.*?)\]\((.*?)\)/gim,
        '<img src="$2" alt="$1" class="img-fluid rounded">'
      )
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
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
    }
    return `<p><a href="${url}" target="_blank">${
      title || 'Watch Video'
    }</a></p>`;
  }

  renderCallout(content: string, type: string = 'info'): string {
  return `
    <div class="callout callout-${type}">
      <div class="callout-content">
        ${this.renderMarkdown(content)}
      </div>
    </div>
  `;
};

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
        return `<div class="rich-text-content">${this.renderMarkdown(
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
        return `<div class="diagram-preview-content">${this.renderMarkdown(
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

  // tutorial-detail.component.ts mai yeh method complete karen

  // FIXED: Load all tutorials for current roadmap step
  async loadAllStepTutorials() {
    if (!this.currentRoadmapStep) return;

    try {
      this.allStepTutorials =
        await this.matrixNotesService.getTutorialsByRoadmapStep(
          this.currentRoadmapStep.id
        );

      // Sort by topicOrder
      this.allStepTutorials.sort(
        (a, b) => (a.topicOrder || 0) - (b.topicOrder || 0)
      );

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

  // tutorial-detail.component.ts mai navigation methods add karen

  // FIXED: Navigate to next topic
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

  // FIXED: Navigate to previous topic
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

  // FIXED: Navigate to tutorial - Use window.location for full page reload
  async navigateToTutorial(tutorialId: string, roadmapStepId: number) {
    console.log(
      `🚀 Navigating to tutorial: ${tutorialId} for step: ${roadmapStepId}`
    );

    // Use window.location for reliable navigation
    const url = `/tutorials/${tutorialId}?roadmapStep=${roadmapStepId}`;
    console.log(`📍 Navigation URL: ${url}`);

    window.location.href = url;
  }
  // ADD these new methods instead:
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
}
