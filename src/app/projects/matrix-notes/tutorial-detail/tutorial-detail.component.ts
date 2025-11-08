import { Component, OnInit, HostListener, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { Tutorial, TutorialComment } from '../../../interfaces/tutorial.model';

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
  styleUrls: ['./tutorial-detail.component.scss']
})
export class TutorialDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tutorial: Tutorial | null = null;
  comments: TutorialComment[] = [];
  relatedTutorials: any[] = [];
  isLoading = true;
  newComment = '';
  isBookmarked = false;
  hasLiked = false;
  showComments = false;
  showBackToTop = false;
  activeSectionId: string = '';
  
  private scrollListener: any;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(
    private matrixNotesService: MatrixNotesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    const tutorialId = this.route.snapshot.paramMap.get('id');
    if (tutorialId) {
      await this.loadTutorial(tutorialId);
      await this.loadComments(tutorialId);
      await this.loadRelatedTutorials(tutorialId);
      await this.checkBookmarkStatus(tutorialId);
      await this.checkLikeStatus(tutorialId);
      this.setupScrollListener();
    }
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
      threshold: 0
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSectionId = entry.target.id;
        }
      });
    }, options);

    // Observe all content sections
    const contentBlocks = document.querySelectorAll('.content-block');
    contentBlocks.forEach(section => {
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

  async loadComments(tutorialId: string) {
    try {
      this.comments = await this.matrixNotesService.getComments(tutorialId);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async loadRelatedTutorials(tutorialId: string) {
    try {
      this.relatedTutorials = [
        {
          id: '1',
          title: 'Getting Started with Angular Components',
          difficulty: 'beginner',
          readingTime: 8
        },
        {
          id: '2',
          title: 'Advanced TypeScript Patterns',
          difficulty: 'advanced',
          readingTime: 15
        }
      ];
    } catch (error) {
      console.error('Error loading related tutorials:', error);
    }
  }

  async checkBookmarkStatus(tutorialId: string) {
    const userId = this.getCurrentUserId();
    try {
      this.isBookmarked = await this.matrixNotesService.isBookmarked(tutorialId, userId);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
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

  async toggleBookmark() {
    if (!this.tutorial) return;

    const userId = this.getCurrentUserId();
    try {
      this.isBookmarked = await this.matrixNotesService.toggleBookmark(this.tutorial.id, userId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  }

  async addComment() {
    if (!this.tutorial || !this.newComment.trim()) return;

    try {
      await this.matrixNotesService.addComment(this.tutorial.id, {
        userId: this.getCurrentUserId(),
        userName: this.getCurrentUserName(),
        content: this.newComment.trim(),
        createdAt: new Date()
      });

      this.newComment = '';
      await this.loadComments(this.tutorial.id);
    } catch (error) {
      console.error('Error adding comment:', error);
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
              id: id
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
        behavior: 'smooth'
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
    const text = encodeURIComponent(`Check out this tutorial: ${this.tutorial?.title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
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
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getAuthorInitials(author: string): string {
    return author.split(' ').map(n => n[0]).join('').toUpperCase();
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
    const colors = ['primary', 'success', 'warning', 'danger', 'info', 'purple', 'pink'];
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
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="img-fluid rounded">')
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
    return `<p><a href="${url}" target="_blank">${title || 'Watch Video'}</a></p>`;
  }

  renderCallout(content: string, type: string = 'info'): string {
    const icons = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      danger: 'fas fa-exclamation-circle',
      success: 'fas fa-check-circle',
      tip: 'fas fa-lightbulb'
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

  renderTable(content: string): string {
    const rows = content.split('\n').filter(row => row.trim());
    if (rows.length === 0) return '';

    let html = '<div class="table-responsive"><table class="table table-striped">';
    rows.forEach((row, index) => {
      const cells = row.split(',').map(cell => cell.trim());
      const tag = index === 0 ? 'th' : 'td';
      html += `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
    });
    html += '</table></div>';
    return html;
  }

  renderContent(content: any): string {
    switch (content.type) {
      case 'text':
        return `<div class="rich-text-content">${this.renderMarkdown(content.content)}</div>`;
      case 'code':
        const fileName = content.fileName ? `<div class="code-filename">${content.fileName}</div>` : '';
        return `
          <div class="code-block-preview">
            ${fileName}
            <pre data-language="${content.language}"><code class="language-${content.language}">${this.escapeHtml(content.content)}</code></pre>
          </div>
        `;
      case 'image':
        const caption = content.caption ? `<div class="image-caption">${content.caption}</div>` : '';
        return `
          <div class="image-block-preview">
            <img src="${content.content}" alt="${content.caption || 'Tutorial image'}" class="img-fluid rounded">
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
        return `<div class="diagram-preview-content">${this.renderMarkdown(content.content)}</div>`;
      default:
        return content.content;
    }
  }

  // Private helper methods
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private extractYouTubeId(url: string): string {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : '';
  }
}