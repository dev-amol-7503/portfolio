// components/solution-detail/solution-detail.component.ts
import { Component, OnInit, AfterViewChecked, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeveloperSolutionsService, DeveloperSolution } from '../../../services/developer-solutions.service';
import { ToastrService } from 'ngx-toastr';
import hljs from 'highlight.js';

// Import specific languages you want to support
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('java', java);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

@Component({
  selector: 'app-solution-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './solution-detail.component.html',
  styleUrls: ['./solution-detail.component.scss']
})
export class SolutionDetailComponent implements OnInit, AfterViewChecked, OnDestroy {
  solution: DeveloperSolution | null = null;
  isLoading = true;
  relatedSolutions: DeveloperSolution[] = [];
  tableOfContents: TableOfContentsItem[] = [];
  private contentProcessed = false;
  private highlightInitialized = false;
  private copyButtonListeners: (() => void)[] = [];
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solutionsService: DeveloperSolutionsService,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const solutionId = params['id'];
      if (solutionId) {
        this.loadSolution(solutionId);
      } else {
        this.toastr.error('Solution not found');
        this.router.navigate(['/projects']);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.solution && !this.contentProcessed && this.isBrowser) {
      this.processContent();
      this.contentProcessed = true;
    }
    
    // Apply syntax highlighting after content is processed
    if (this.solution && !this.highlightInitialized && this.isBrowser) {
      setTimeout(() => {
        this.applySyntaxHighlighting();
        this.addCopyButtons();
        this.highlightInitialized = true;
      }, 100);
    }
  }

  ngOnDestroy() {
    this.highlightInitialized = false;
    this.contentProcessed = false;
    
    // Clean up event listeners
    this.copyButtonListeners.forEach(removeListener => removeListener());
    this.copyButtonListeners = [];
  }

  async loadSolution(id: string) {
    this.isLoading = true;
    try {
      const solution = await this.solutionsService.getSolution(id);
      if (solution) {
        this.solution = solution;
        this.loadRelatedSolutions(solution.category, id);
        
        // Increment view count
        await this.solutionsService.incrementViews(id);
      } else {
        this.toastr.error('Solution not found');
        this.router.navigate(['/projects']);
      }
    } catch (error) {
      this.toastr.error('Failed to load solution');
      console.error('Error loading solution:', error);
    } finally {
      this.isLoading = false;
    }
  }

  loadRelatedSolutions(category: string, currentSolutionId: string) {
    const related = this.solutionsService.getSolutionsByCategory(category)
      .filter(sol => sol.id !== currentSolutionId)
      .slice(0, 3);
    this.relatedSolutions = related;
  }

  processContent() {
    if (!this.solution?.content || !this.isBrowser) return;

    const contentElement = document.querySelector('.content-html');
    if (!contentElement) return;

    // Process table of contents
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.solution.content;
    
    const headings = tempDiv.querySelectorAll('h2, h3');
    this.tableOfContents = Array.from(headings).map((heading, index) => {
      const id = `heading-${index}`;
      
      // Add IDs to actual headings in the content
      const actualHeading = contentElement.querySelector(`h2:nth-of-type(${index + 1}), h3:nth-of-type(${index + 1})`);
      if (actualHeading) {
        actualHeading.id = id;
      }
      
      return {
        id,
        text: heading.textContent || '',
        level: heading.tagName === 'H2' ? 2 : 3
      };
    });
  }

  applySyntaxHighlighting() {
    if (!this.isBrowser) return;

    const contentElement = document.querySelector('.content-html');
    if (!contentElement) return;

    // Find all code blocks and apply syntax highlighting
    const codeBlocks = contentElement.querySelectorAll('pre.ql-syntax');
    codeBlocks.forEach((block: Element) => {
      const codeElement = block.querySelector('code');
      if (codeElement) {
        // Remove any existing classes and add hljs
        codeElement.className = 'hljs';
        
        // Apply highlighting
        hljs.highlightElement(codeElement as HTMLElement);
      } else {
        // If no code element exists, create one and highlight
        const code = document.createElement('code');
        code.className = 'hljs';
        code.textContent = block.textContent;
        block.innerHTML = '';
        block.appendChild(code);
        hljs.highlightElement(code);
      }
    });

    // Also highlight inline code if needed
    const inlineCodeElements = contentElement.querySelectorAll('code:not(.hljs)');
    inlineCodeElements.forEach((code: Element) => {
      if (!code.classList.contains('ql-syntax')) {
        code.classList.add('inline-code');
      }
    });
  }

  addCopyButtons() {
    if (!this.isBrowser) return;

    const contentElement = document.querySelector('.content-html');
    if (!contentElement) return;

    const codeBlocks = contentElement.querySelectorAll('pre.ql-syntax');
    
    codeBlocks.forEach((block: Element, index: number) => {
      // Remove existing copy button if any
      const existingButton = block.querySelector('.copy-code-btn');
      if (existingButton) {
        existingButton.remove();
      }

      const copyButton = document.createElement('button');
      copyButton.innerHTML = 'Copy';
      copyButton.className = 'copy-code-btn';
      copyButton.setAttribute('type', 'button');
      copyButton.setAttribute('aria-label', 'Copy code to clipboard');
      
      block.appendChild(copyButton);

      // Add click event listener
      const copyHandler = () => {
        const code = block.querySelector('code')?.textContent || block.textContent || '';
        this.copyToClipboard(code).then(() => {
          // Success state
          copyButton.innerHTML = 'Copied!';
          copyButton.classList.add('copied');
          
          setTimeout(() => {
            copyButton.innerHTML = 'Copy';
            copyButton.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy code:', err);
          // Error state
          copyButton.innerHTML = 'Failed!';
          copyButton.classList.add('error');
          
          setTimeout(() => {
            copyButton.innerHTML = 'Copy';
            copyButton.classList.remove('error');
          }, 2000);
        });
      };

      copyButton.addEventListener('click', copyHandler);
      
      // Store the remove function
      this.copyButtonListeners.push(() => {
        copyButton.removeEventListener('click', copyHandler);
      });
    });
  }

  private async copyToClipboard(text: string): Promise<void> {
    if (!this.isBrowser) {
      throw new Error('Clipboard API not available');
    }

    try {
      // Use the modern Clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Failed to copy using execCommand');
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      throw err;
    }
  }

  scrollToHeading(headingId: string) {
    if (!this.isBrowser) return;

    const element = document.getElementById(headingId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  scrollToTop() {
    if (!this.isBrowser) return;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async likeSolution() {
    if (this.solution) {
      try {
        await this.solutionsService.toggleLike(this.solution.id!);
        // Refresh the solution to get updated likes count
        this.loadSolution(this.solution.id!);
        this.toastr.success('Solution liked!');
      } catch (error) {
        this.toastr.error('Failed to like solution');
      }
    }
  }

  shareSolution() {
    if (!this.isBrowser || !this.solution) return;

    if (navigator.share) {
      // Use Web Share API if available
      navigator.share({
        title: this.solution.title,
        text: this.solution.description,
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        this.fallbackShare();
      });
    } else {
      this.fallbackShare();
    }
  }

  private fallbackShare() {
    if (!this.isBrowser) return;

    // Fallback: copy to clipboard and show toast
    this.copyLink();
  }

  copyLink() {
    if (!this.isBrowser) return;

    const url = window.location.href;
    this.copyToClipboard(url).then(() => {
      this.toastr.success('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link:', err);
      this.toastr.error('Failed to copy link');
    });
  }

  printSolution() {
    if (!this.isBrowser) return;

    window.print();
  }

  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning text-dark';
      case 'advanced': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'git': 'fab fa-git-alt',
      'angular': 'fab fa-angular',
      'typescript': 'fas fa-code',
      'javascript': 'fab fa-js-square',
      'html-css': 'fab fa-html5',
      'spring-boot': 'fas fa-leaf',
      'java': 'fab fa-java',
      'database': 'fas fa-database',
      'devops': 'fas fa-cloud',
      'general': 'fas fa-cogs'
    };
    return icons[category] || 'fas fa-code';
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'git': 'Git & Version Control',
      'angular': 'Angular',
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'html-css': 'HTML & CSS',
      'spring-boot': 'Spring Boot',
      'java': 'Java',
      'database': 'Database',
      'devops': 'DevOps',
      'general': 'General Programming'
    };
    return labels[category] || category;
  }

  goBack() {
    this.router.navigate(['/projects'], { queryParams: { tab: 'articles' } });
  }

  // Utility method to check if content has code blocks
  hasCodeBlocks(): boolean {
    if (!this.solution?.content || !this.isBrowser) return false;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.solution.content;
    return tempDiv.querySelectorAll('pre.ql-syntax').length > 0;
  }

  // Method to get estimated reading time with code blocks
  getEnhancedReadTime(): number {
    if (!this.solution) return 0;

    const baseTime = this.solution.readTime || 5;
    
    // Add extra time for code blocks
    if (this.hasCodeBlocks()) {
      return baseTime + 2;
    }
    
    return baseTime;
  }

  // Method to format date safely
  getFormattedDate(date: any): string {
    if (!date) return 'Unknown date';
    
    try {
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      } else if (date instanceof Date) {
        return date.toLocaleDateString();
      } else {
        return new Date(date).toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }

  // Method to handle image loading errors
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    
    // You could also show a placeholder image
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.innerHTML = '<i class="fas fa-image"></i><span>Image not available</span>';
    placeholder.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--theme-bg-secondary, #f8fafc);
      border: 2px dashed var(--theme-border, #e2e8f0);
      border-radius: 12px;
      padding: 2rem;
      color: var(--theme-text-secondary, #64748b);
      text-align: center;
      margin: 2rem 0;
    `;
    
    img.parentNode?.insertBefore(placeholder, img.nextSibling);
  }
}