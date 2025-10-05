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
          imageUrl: 'assets/images/project1.jpg',
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
        imageUrl: 'assets/images/online-clipboard.jpg',
        link: '/#/online-clipboard',
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
        }
      ],
      skills: [
        { name: 'Angular', level: 90, color: '#dd0031', category: 'frontend' },
        { name: 'Java/Spring Boot', level: 85, color: '#5382a1', category: 'backend' }
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
            'Designed and developed RESTful APIs using Spring Boot'
          ],
          technologies: ['Angular', 'Spring Boot', 'Docker', 'Jenkins', 'MySQL', 'REST APIs']
        }
      ],
      socialPosts: [
        {
          id: 1,
          title: 'How to Organize Your Spring Boot Project for Scalability',
          description: 'Discover best practices for structuring your Spring Boot project.',
          link: 'https://medium.com/@thematrixxworld/how-to-organize-your-spring-boot-project',
          date: 'April 12, 2025',
          readTime: '2 min',
          likes: 245,
          platform: 'medium'
        }
      ],
      personalInfo: {
        name: 'Amol Nagare',
        title: 'Full Stack Developer',
        email: 'amolnagare279@gmail.com',
        phone: '+91 9975607503',
        location: 'Pune, India',
        about: 'Full Stack Developer with 3+ years of experience in Angular, Java (Spring Boot), and RESTful APIs.'
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