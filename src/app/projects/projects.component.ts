import { Component, OnInit, ElementRef, ViewChildren, QueryList, AfterViewInit, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
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
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;
  @ViewChild('carouselSection') carouselSection!: ElementRef;

  isDarkTheme = false;
  isEditMode = false;

  // Carousel properties
  currentSlideIndex = 0;
  isAutoScrollActive = true;
  autoScrollInterval: any;
  private readonly autoScrollDelay = 5000; // 5 seconds
  private isScrolling = false;

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
      
      this.startAutoScroll();
    });
  }

  ngAfterViewInit() {
    this.initializeLottieAnimations();
    this.setupScrollListener();
    
    this.lottieContainers.changes.subscribe(() => {
      this.initializeLottieAnimations();
    });
  }

  ngOnDestroy() {
    this.stopAutoScroll();
  }

  private initializeLottieAnimations() {
    this.lottieContainers.forEach((container, index) => {
      const project = this.projects[index];
      if (project && project.animationUrl) {
        lottie.loadAnimation({
          container: container.nativeElement,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: project.animationUrl
        });
      }
    });
  }

  private setupScrollListener() {
    if (this.carouselSection) {
      const section = this.carouselSection.nativeElement;
      
      section.addEventListener('scroll', () => {
        this.handleScroll();
      });
    }
  }

  private handleScroll() {
    if (this.isScrolling) return;
    
    this.isScrolling = true;
    
    if (this.carouselSection) {
      const section = this.carouselSection.nativeElement;
      const scrollTop = section.scrollTop;
      const slideHeight = section.clientHeight;
      const newIndex = Math.floor(scrollTop / slideHeight);
      
      if (newIndex !== this.currentSlideIndex && newIndex >= 0 && newIndex < this.projects.length) {
        this.currentSlideIndex = newIndex;
      }
    }
    
    // Debounce scroll handling
    setTimeout(() => {
      this.isScrolling = false;
    }, 100);
  }

  // Auto-scroll functionality
  startAutoScroll() {
    if (this.projects.length <= 1) return;
    
    this.stopAutoScroll();
    this.isAutoScrollActive = true;
    
    this.autoScrollInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoScrollDelay);
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  pauseAutoScroll() {
    this.stopAutoScroll();
  }

  resumeAutoScroll() {
    if (this.isAutoScrollActive) {
      this.startAutoScroll();
    }
  }

  // Navigation methods
  nextSlide() {
    if (this.projects.length === 0) return;
    
    const nextIndex = (this.currentSlideIndex + 1) % this.projects.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    if (this.projects.length === 0) return;
    
    const prevIndex = this.currentSlideIndex === 0 
      ? this.projects.length - 1 
      : this.currentSlideIndex - 1;
    this.goToSlide(prevIndex);
  }

  goToSlide(index: number) {
    if (index >= 0 && index < this.projects.length && this.carouselSection) {
      this.currentSlideIndex = index;
      const section = this.carouselSection.nativeElement;
      const slideHeight = section.clientHeight;
      const scrollPosition = index * slideHeight;
      
      section.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }

  // Check if slide is visible
  isSlideVisible(index: number): boolean {
    return Math.abs(index - this.currentSlideIndex) <= 1;
  }

  // Get progress percentage
  getProgressPercentage(): number {
    if (this.projects.length === 0) return 0;
    return ((this.currentSlideIndex + 1) / this.projects.length) * 100;
  }

  // Tab change handler
  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'projects') {
      this.currentSlideIndex = 0;
      this.startAutoScroll();
    } else {
      this.stopAutoScroll();
    }
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
        animationUrl: this.newProject.animationUrl || 'https://assets1.lottiefiles.com/packages/lf20_vybwn7df.json',
        link: this.newProject.link || '#',
        githubLink: this.newProject.githubLink,
        category: this.newProject.category || 'Web Application',
        featured: this.newProject.featured || false
      };
      
      this.adminService.addProject(project);
      this.newProject = {};
      this.currentSlideIndex = 0;
    }
  }

  deleteProject(project: Project, event: Event) {
    if (this.isEditMode) {
      event.preventDefault();
      event.stopPropagation();
      
      if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
        this.adminService.deleteProject(project.id);
        if (this.currentSlideIndex >= this.projects.length) {
          this.currentSlideIndex = Math.max(0, this.projects.length - 1);
        }
      }
    }
  }

  // Handle window resize
  @HostListener('window:resize')
  onResize() {
    // Update scroll position on resize
    setTimeout(() => {
      this.goToSlide(this.currentSlideIndex);
    }, 100);
  }
}