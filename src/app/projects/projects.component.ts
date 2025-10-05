import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../services/project.service';
import { ThemeService } from '../services/theme.service';
import { Project, SocialPost } from '../interfaces/social-post.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  isDarkTheme = false;

  // Visible items arrays
  visibleProjects: Project[] = [];
  visibleMediumPosts: SocialPost[] = [];
  visibleQuoraPosts: SocialPost[] = [];
  visibleLinkedinPosts: SocialPost[] = [];

  // Number of items to show initially and per click
  private readonly initialItemsToShow = 3;
  private readonly itemsPerLoad = 3;

  activeTab: string = 'projects';

  projects: Project[] = [
    {
      id: 1,
      title: "Amol's Portfolio",
      description:
        'A responsive and visually engaging portfolio website designed and developed to showcase my skills, experience, and projects. Built using HTML, SCSS, Bootstrap, and Angular, this project highlights my front-end development abilities and design sense. The website features smooth navigation, modern UI elements, and a mobile-friendly layout. It serves as a central hub to present my professional journey and technical expertise to potential employers and collaborators.',
      technologies: ['HTML/SCSS', 'Bootstrap', 'Angular'],
      imageUrl: '../../assets/images/project1.jpg',
      link: 'https://www.thematrixworld.in/',
      githubLink: 'https://github.com/thematrixxworld/amol-portfolio.git',
      category: 'Web Application',
    },
  ];

  mediumPosts: SocialPost[] = [
    {
      title: 'How to Organize Your Spring Boot Project for Scalability.',
      description:
        'Discover best practices for structuring your Spring Boot project to enhance readability, maintainability, and scalability for long-term success.',
      link: 'https://medium.com/@thematrixxworld/how-to-organize-your-spring-boot-project-a-guide-for-clean-and-scalable-code-fafa9563cfff',
      date: 'April 12, 2025',
      readTime: '2 min',
      likes: 245,
    },
    {
      title: 'Introduction to Spring Boot: Key Concepts.',
      description:
        'An easy-to-follow guide for beginners to grasp the fundamentals of Spring Boot, covering essential concepts to jumpstart your backend development.',
      link: 'https://medium.com/@thematrixxworld/spring-boot-basics-bd4d18b045b3',
      date: 'April 12, 2025',
      readTime: '5 min',
      likes: 189,
    },
    {
      title: 'Step-by-Step Guide to Setting Up a Spring Boot Project.',
      description:
        'A simple guide to quickly set up a Spring Boot project with a clean structure, best practices, and essential tips for scalability and maintainability.',
      link: 'https://medium.com/@thematrixxworld/quick-guide-to-spring-boot-setup-997618defae0',
      date: 'April 12, 2025',
      readTime: '5 min',
      likes: 369,
    },
    
  ];

  quoraPosts: SocialPost[] = [
    {
      title: 'Spring Boot Basics',
      description:
        'A simple guide to quickly set up a Spring Boot project with a clean structure, best practices, and essential tips for scalability and maintainability',
      link: 'https://qr.ae/pAKGPl',
      date: 'April 12, 2025',
      views: '12.5k',
      upvotes: 342,
    },
  ];

  linkedinPosts: SocialPost[] = [
    {
      title: 'Angular Developer Roadmap',
      description:
        'A step-by-step guide to mastering Angular, covering key concepts, tools, and best practices for building modern web applications.',
      link: 'https://www.linkedin.com/pulse/angular-developer-roadmap-amol-nagare-nsnzf',
      date: 'April 13, 2025',
      engagement: 'High',
      comments: 56,
    },
  ];

  constructor(private ThemeService: ThemeService) {}

  ngOnInit() {
    this.resetVisibleItems();
    // Initialize with service data if available
    this.ThemeService.isDarkTheme$.subscribe((isDark) => {
      this.isDarkTheme = isDark;
    });

    // Initialize visible items - add console logs to verify

    this.visibleProjects = this.projects.slice(0, this.initialItemsToShow);
    this.visibleMediumPosts = this.mediumPosts.slice(
      0,
      this.initialItemsToShow
    );
    this.visibleQuoraPosts = this.quoraPosts.slice(0, this.initialItemsToShow);
    this.visibleLinkedinPosts = this.linkedinPosts.slice(
      0,
      this.initialItemsToShow
    );
  }

  // Reset all visible items to initial state
  resetVisibleItems() {
    this.visibleProjects = this.projects.slice(0, this.initialItemsToShow);
    this.visibleMediumPosts = this.mediumPosts.slice(
      0,
      this.initialItemsToShow
    );
    this.visibleQuoraPosts = this.quoraPosts.slice(0, this.initialItemsToShow);
    this.visibleLinkedinPosts = this.linkedinPosts.slice(
      0,
      this.initialItemsToShow
    );
  }

  // Update this when tab changes
  onTabChange(tabId: string) {
    this.activeTab = tabId;
    this.resetVisibleItems();
  }

  showMoreProjects() {
    const nextItems = this.projects.slice(
      this.visibleProjects.length,
      this.visibleProjects.length + this.itemsPerLoad
    );
    this.visibleProjects = [...this.visibleProjects, ...nextItems];
  }

  showMoreMediumPosts() {
    const nextItems = this.mediumPosts.slice(
      this.visibleMediumPosts.length,
      this.visibleMediumPosts.length + this.itemsPerLoad
    );
    this.visibleMediumPosts = [...this.visibleMediumPosts, ...nextItems];
  }

  showMoreQuoraPosts() {
    const nextItems = this.quoraPosts.slice(
      this.visibleQuoraPosts.length,
      this.visibleQuoraPosts.length + this.itemsPerLoad
    );
    this.visibleQuoraPosts = [...this.visibleQuoraPosts, ...nextItems];
  }

  showMoreLinkedinPosts() {
    const nextItems = this.linkedinPosts.slice(
      this.visibleLinkedinPosts.length,
      this.visibleLinkedinPosts.length + this.itemsPerLoad
    );
    this.visibleLinkedinPosts = [...this.visibleLinkedinPosts, ...nextItems];
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
}
