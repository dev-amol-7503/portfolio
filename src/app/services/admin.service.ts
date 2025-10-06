import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Project, SocialPost, Testimonial, Skill, Experience } from '../interfaces/social-post.model';

export interface PortfolioData {
  projects: Project[];
  testimonials: Testimonial[];
  skills: Skill[];
  experiences: Experience[];
  socialPosts: SocialPost[];
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    about: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private isAdmin = new BehaviorSubject<boolean>(false);
  private editMode = new BehaviorSubject<boolean>(false);
  private portfolioData = new BehaviorSubject<PortfolioData>(this.getInitialData());
  
  isAdmin$ = this.isAdmin.asObservable();
  editMode$ = this.editMode.asObservable();
  portfolioData$ = this.portfolioData.asObservable();

  private readonly adminCredentials = {
    username: 'admin',
    password: 'admin123'
  };

  constructor() {
    this.loadFromLocalStorage();
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      this.isAdmin.next(true);
    }
  }

  private getInitialData(): PortfolioData {
  return {
    projects: [
      {
        id: 1,
        title: "Amol's Portfolio",
        description: 'A responsive and visually engaging portfolio website designed and developed to showcase my skills, experience, and projects.',
        technologies: ['HTML/SCSS', 'Bootstrap', 'Angular'],
        imageUrl: 'https://cdn.dribbble.com/users/527354/screenshots/15313994/media/8f3c9c9c9c9c9c9c9c9c9c9c9c9c9c9c.gif',
        link: 'https://www.thematrixworld.in/',
        githubLink: 'https://github.com/thematrixxworld/amol-portfolio.git',
        category: 'Web Application',
        featured: true
      },
      {
        id: 2,
        title: "Online Clipboard",
        description: 'A real-time text sharing platform that allows users to share unlimited text across devices using secure 4-digit codes. Features one-click copy, instant sharing, and retrieval with beautiful UI. Built with Angular and modern web technologies.',
        technologies: ['Angular', 'TypeScript', 'Bootstrap', 'RxJS', 'Local Storage API', 'Clipboard API'],
        imageUrl: 'https://cdn.dribbble.com/users/1355613/screenshots/15314153/media/6ab1f57d8c1958761c9e6b4b3c4c4b4b.gif',
        link: '/portfolio/#/online-clipboard',
        githubLink: 'https://github.com/thematrixxworld/online-clipboard',
        category: 'Web Application',
        featured: true
      },
    ],
    testimonials: [
      {
        id: 1,
        name: 'Vijay Gheji',
        position: 'Project Manager at TCS',
        text: 'Amol is an exceptional developer with an unwavering commitment to delivering high-quality work.',
        image: 'assets/images/profile-user.png',
        rating: 5
      },
      {
        id: 2,
        name: 'Rahul Sharma',
        position: 'Senior Developer at Infosys',
        text: 'Great problem-solving skills and always delivers on time. A valuable team player.',
        image: 'assets/images/profile-user.png',
        rating: 4
      }
    ],
    skills: [
      { name: 'Angular', level: 90, color: '#dd0031', category: 'frontend' },
      { name: 'Java/Spring Boot', level: 85, color: '#5382a1', category: 'backend' },
      { name: 'TypeScript', level: 88, color: '#3178c6', category: 'frontend' },
      { name: 'Bootstrap', level: 85, color: '#7952b3', category: 'frontend' },
      { name: 'HTML/CSS', level: 92, color: '#e34f26', category: 'frontend' },
    ],
    experiences: [
      {
        id: 1,
        company: 'TATA CONSULTANCY SERVICES LIMITED',
        position: 'Full Stack Developer',
        period: '2021 - Present',
        logo: 'assets/images/tcs-logo.png',
        description: 'Worked on developing and maintaining enterprise-level applications using Angular and Spring Boot.',
        responsibilities: [
          'Developed and maintained the UI of Ignio environment using Angular',
          'Designed and developed RESTful APIs using Spring Boot',
          'Implemented responsive designs and cross-browser compatibility',
          'Collaborated with backend teams for API integration'
        ],
        technologies: ['Angular', 'Spring Boot', 'Docker', 'Jenkins', 'MySQL', 'REST APIs']
      },
      {
        id: 2,
        company: 'Freelance Projects',
        position: 'Full Stack Developer',
        period: '2020 - 2021',
        logo: 'assets/images/freelance-logo.png',
        description: 'Worked on various freelance projects building web applications and portfolios.',
        responsibilities: [
          'Developed responsive websites for small businesses',
          'Created RESTful APIs for mobile applications',
          'Implemented modern UI/UX designs'
        ],
        technologies: ['Angular', 'Node.js', 'MongoDB', 'Bootstrap']
      }
    ],
    socialPosts: [
      {
        id: 1,
        title: 'How to Organize Your Spring Boot Project for Scalability',
        description: 'Discover best practices for structuring your Spring Boot project for better maintainability and scalability.',
        link: 'https://medium.com/@thematrixxworld/how-to-organize-your-spring-boot-project',
        date: 'April 12, 2025',
        readTime: '2 min',
        likes: 245,
        platform: 'medium'
      },
      {
        id: 2,
        title: 'Angular Performance Optimization Tips',
        description: 'Learn advanced techniques to optimize your Angular applications for better performance.',
        link: 'https://medium.com/@thematrixxworld/angular-performance-optimization',
        date: 'March 28, 2025',
        readTime: '5 min',
        likes: 189,
        platform: 'medium'
      }
    ],
    personalInfo: {
      name: 'Amol Nagare',
      title: 'Full Stack Developer',
      email: 'amolnagare279@gmail.com',
      phone: '+91 9975607503',
      location: 'Pune, India',
      about: 'Full Stack Developer with 3+ years of experience in Angular, Java (Spring Boot), and RESTful APIs. Passionate about creating efficient, scalable web applications with modern technologies.'
    }
  };
}

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedData = localStorage.getItem('portfolioData');
      if (savedData) {
        this.portfolioData.next(JSON.parse(savedData));
      }
    }
  }

  private saveToLocalStorage(data: PortfolioData) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('portfolioData', JSON.stringify(data));
    }
  }

  login(username: string, password: string): boolean {
    if (username === this.adminCredentials.username && 
        password === this.adminCredentials.password) {
      this.isAdmin.next(true);
      localStorage.setItem('adminSession', 'true');
      return true;
    }
    return false;
  }

  logout() {
    this.isAdmin.next(false);
    this.editMode.next(false);
    localStorage.removeItem('adminSession');
  }

  toggleEditMode() {
    this.editMode.next(!this.editMode.value);
  }

  // Data management methods
  updateProject(project: Project): void {
    const currentData = this.portfolioData.value;
    const updatedProjects = currentData.projects.map(p => 
      p.id === project.id ? project : p
    );
    const newData = { ...currentData, projects: updatedProjects };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  addProject(project: Project): void {
    const currentData = this.portfolioData.value;
    const newProject = { ...project, id: Date.now() };
    const updatedProjects = [newProject, ...currentData.projects];
    const newData = { ...currentData, projects: updatedProjects };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  deleteProject(projectId: number): void {
    const currentData = this.portfolioData.value;
    const updatedProjects = currentData.projects.filter(p => p.id !== projectId);
    const newData = { ...currentData, projects: updatedProjects };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  updatePersonalInfo(info: any): void {
    const currentData = this.portfolioData.value;
    const newData = { ...currentData, personalInfo: info };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  // Similar methods for testimonials, skills, experiences, socialPosts
  updateTestimonial(testimonial: Testimonial): void {
    const currentData = this.portfolioData.value;
    const updatedTestimonials = currentData.testimonials.map(t => 
      t.id === testimonial.id ? testimonial : t
    );
    const newData = { ...currentData, testimonials: updatedTestimonials };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  addTestimonial(testimonial: Testimonial): void {
    const currentData = this.portfolioData.value;
    const newTestimonial = { ...testimonial, id: Date.now() };
    const updatedTestimonials = [newTestimonial, ...currentData.testimonials];
    const newData = { ...currentData, testimonials: updatedTestimonials };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  deleteTestimonial(testimonialId: number): void {
    const currentData = this.portfolioData.value;
    const updatedTestimonials = currentData.testimonials.filter(t => t.id !== testimonialId);
    const newData = { ...currentData, testimonials: updatedTestimonials };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }
}