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
import { ThemeService } from '../../../services/theme.service';

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
    public themeService: ThemeService,
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
      // ... include your existing backend steps
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
      // ... include your existing frontend steps
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

  getCalloutIcon(type: string = 'info'): string {
    const icons: { [key: string]: string } = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      danger: 'fas fa-exclamation-circle',
      success: 'fas fa-check-circle',
      tip: 'fas fa-lightbulb',
    };
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

  // Private helper methods
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