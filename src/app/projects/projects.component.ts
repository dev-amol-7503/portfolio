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
import { DeveloperSolutionsService, DeveloperSolution } from '../services/developer-solutions.service';
import { Project, SocialPost } from '../interfaces/social-post.model';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import lottie from 'lottie-web';

interface CodingProfile {
  id: number;
  title: string;
  platform: string;
  description: string;
  profileUrl: string;
  challenges: number;
  badges: number;
  rating?: number;
  icon: string;
  color: string;
  featured?: boolean;
}

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
  codingProfiles: CodingProfile[] = [];
  developerSolutions: DeveloperSolution[] = [];

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

  // New coding profile form
  newCodingProfile: {
    title?: string;
    platform?: string;
    description?: string;
    profileUrl?: string;
    challenges?: number;
    badges?: number;
    rating?: number;
    icon?: string;
    color?: string;
  } = {};

  private lottieAnimations: any[] = [];

  constructor(
    private themeService: ThemeService,
    private adminService: AdminService,
    private solutionsService: DeveloperSolutionsService,
    private router: Router, 
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
      this.projects = data.projects || [];
      this.cdRef.detectChanges();
    });

    // Load coding profiles
    this.loadCodingProfiles();

    // Load developer solutions
    this.solutionsService.solutions$.subscribe(solutions => {
      this.developerSolutions = solutions.filter(sol => sol.published);
      this.cdRef.detectChanges();
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

  // Get featured solutions
  get featuredSolutions(): DeveloperSolution[] {
    return this.developerSolutions.filter(solution => solution.featured).slice(0, 2);
  }

  // Get regular solutions
  get regularSolutions(): DeveloperSolution[] {
    return this.developerSolutions.filter(solution => !solution.featured);
  }


  private loadCodingProfiles() {
    this.codingProfiles = [
      {
        id: 1,
        title: 'HackerRank',
        platform: 'HackerRank',
        description: 'Problem solving challenges and coding competitions with 5-star gold badges in Java and Python.',
        profileUrl: 'https://www.hackerrank.com/profile/amolnagare',
        challenges: 127,
        badges: 15,
        rating: 4.8,
        icon: 'fas fa-code',
        color: '#2EC866',
        featured: true
      },
      {
        id: 2,
        title: 'LeetCode',
        platform: 'LeetCode',
        description: 'Solved 200+ algorithm and data structure problems with focus on optimization and efficiency.',
        profileUrl: 'https://leetcode.com/amolnagare',
        challenges: 203,
        badges: 8,
        rating: 4.5,
        icon: 'fas fa-laptop-code',
        color: '#FFA116',
        featured: true
      },
      {
        id: 3,
        title: 'CodeChef',
        platform: 'CodeChef',
        description: 'Competitive programming with 3-star rating and participation in monthly coding contests.',
        profileUrl: 'https://www.codechef.com/users/amolnagare',
        challenges: 89,
        badges: 6,
        rating: 3.2,
        icon: 'fas fa-chess-knight',
        color: '#5C2D91',
        featured: false
      },
      {
        id: 4,
        title: 'GitHub',
        platform: 'GitHub',
        description: 'Active open source contributor with 50+ repositories and 100+ commits in the last year.',
        profileUrl: 'https://github.com/thematrixxworld',
        challenges: 0,
        badges: 0,
        icon: 'fab fa-github',
        color: '#4078c0',
        featured: true
      },
    ];
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
        case 'coding':
          items = this.codingProfiles;
          break;
        case 'articles':
          items = this.developerSolutions;
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

  // Coding Profiles Methods
  addCodingProfile() {
    // Show the add coding profile form
    this.newCodingProfile = {};
  }

  addNewCodingProfile() {
    if (
      this.isEditMode &&
      this.newCodingProfile.title &&
      this.newCodingProfile.platform
    ) {
      const profile: CodingProfile = {
        id: Date.now(),
        title: this.newCodingProfile.title,
        platform: this.newCodingProfile.platform,
        description: this.newCodingProfile.description || 'Coding challenge platform profile',
        profileUrl: this.newCodingProfile.profileUrl || '#',
        challenges: this.newCodingProfile.challenges || 0,
        badges: this.newCodingProfile.badges || 0,
        rating: this.newCodingProfile.rating,
        icon: this.getPlatformIcon(this.newCodingProfile.platform),
        color: this.getPlatformColor(this.newCodingProfile.platform),
        featured: false
      };

      this.codingProfiles = [profile, ...this.codingProfiles];
      this.newCodingProfile = {};
      this.cdRef.detectChanges();
    }
  }

  private getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      'HackerRank': 'fas fa-code',
      'LeetCode': 'fas fa-laptop-code',
      'CodeChef': 'fas fa-chess-knight',
      'GitHub': 'fab fa-github',
      'Stack Overflow': 'fab fa-stack-overflow',
      'Codewars': 'fas fa-fist-raised',
      'GeeksforGeeks': 'fas fa-laptop-code',
      'AtCoder': 'fas fa-robot'
    };
    return icons[platform] || 'fas fa-code';
  }

  private getPlatformColor(platform: string): string {
    const colors: { [key: string]: string } = {
      'HackerRank': '#2EC866',
      'LeetCode': '#FFA116',
      'CodeChef': '#5C2D91',
      'GitHub': '#4078c0',
      'Stack Overflow': '#f48024',
      'Codewars': '#b1361e',
      'GeeksforGeeks': '#2F8D46',
      'AtCoder': '#283F5D'
    };
    return colors[platform] || '#2563eb';
  }

  deleteCodingProfile(profile: CodingProfile, event: Event) {
    if (this.isEditMode) {
      event.preventDefault();
      event.stopPropagation();

      if (confirm(`Are you sure you want to delete "${profile.title}"?`)) {
        this.codingProfiles = this.codingProfiles.filter(p => p.id !== profile.id);
        this.cdRef.detectChanges();
      }
    }
  }

  likeSolution(solution: DeveloperSolution, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.solutionsService.toggleLike(solution.id!);
  }

  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
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
      'spring-boot': 'fas fa-leaf',
      'java': 'fab fa-java',
      'database': 'fas fa-database',
      'devops': 'fas fa-cloud',
      'general': 'fas fa-cogs'
    };
    return icons[category] || 'fas fa-code';
  }

  // TEST METHOD: Clear specific tab data for testing
  clearTabDataForTesting(tabName: string) {
    console.log('🧪 Clearing data for:', tabName);

    switch (tabName) {
      case 'projects':
        this.projects = [];
        break;
      case 'coding':
        this.codingProfiles = [];
        break;
      case 'articles':
        this.developerSolutions = [];
        break;
    }

    this.cdRef.detectChanges();
    console.log('✅ Data cleared for:', tabName);
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

  // In projects.component.ts - Update the viewSolution method
  viewSolution(solution: DeveloperSolution) {
    // Navigate to solution detail page
    this.router.navigate(['/solutions', solution.id]);
  }
}