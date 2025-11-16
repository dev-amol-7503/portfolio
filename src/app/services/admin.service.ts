import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Project,
  SocialPost,
  Testimonial,
  Skill,
  Experience,
} from '../interfaces/social-post.model';

export interface PortfolioData {
  projects: Project[];
  skills: Skill[];
  experiences: Experience[];
  socialPosts: SocialPost[];
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    education: string;
    language: string;
    location: string;
    about: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private isAdmin = new BehaviorSubject<boolean>(false);
  private editMode = new BehaviorSubject<boolean>(false);
  private portfolioData = new BehaviorSubject<PortfolioData>(
    this.getInitialData()
  );

  isAdmin$ = this.isAdmin.asObservable();
  editMode$ = this.editMode.asObservable();
  portfolioData$ = this.portfolioData.asObservable();

  private readonly adminCredentials = {
    username: 'Matrix',
    password: 'Matrix@7503',
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
          title: 'MatrixText',
          description:
            'A real-time text sharing app to send and receive unlimited text across devices using a secure 4-digit code. Fast sharing, one-click copy, and clean modern UI.',
          technologies: [
            'Angular',
            'TypeScript',
            'Bootstrap',
            'RxJS',
            'Clipboard API',
          ],
          imageUrl: 'assets/images/clipboard-placeholder.jpg',
          animationUrl: 'assets/lottie/matrix-clipboard-animation.json',
          link: '/online-clipboard',
          githubLink: 'https://github.com/thematrixxworld/online-clipboard',
          category: 'Web Application',
          featured: true,
        },
        {
          id: 2,
          title: "AmolWorks",
          description:
            'A responsive and attractive portfolio website created to showcase my skills, experience, and projects in a clear, engaging, and professional manner across all devices.',
          technologies: ['HTML/SCSS', 'Bootstrap', 'Angular', 'TypeScript'],
          imageUrl: 'assets/images/portfolio-placeholder.jpg',
          animationUrl: 'assets/lottie/portfolio-animation.json',
          link: 'https://amol-works.vercel.app/',
          githubLink: 'https://github.com/thematrixxworld/amol-portfolio.git',
          category: 'Web Application',
          featured: true,
        },
        {
          id: 5,
          title: 'MatrixNotes',
          description:
            'A comprehensive tutorial and notes management application with rich-text editing, real-time collaboration, and advanced content-management features.',
          technologies: [
            'Angular',
            'CSS/SCSS',
            'Bootstrap',
            'Rich Text Editor',
            'Firebase Database'
          ],
          imageUrl: 'assets/images/matrix-notes-placeholder.jpg',
          animationUrl: 'assets/lottie/matrix-notes.json',
          link: '/tutorials', // This will take users to tutorials list
          githubLink: 'https://github.com/thematrixxworld/matrix-notes',
          category: 'Web Application',
          featured: true,
        },
        /*
        {
          id: 4,
          title: 'E-Commerce Dashboard',
          description:
            'A comprehensive admin dashboard for e-commerce businesses with real-time analytics, inventory management, and sales tracking.',
          technologies: [
            'Angular',
            'TypeScript',
            'Chart.js',
            'Bootstrap',
            'REST APIs',
          ],
          imageUrl: 'assets/images/dashboard-placeholder.jpg',
          animationUrl: 'assets/lottie/shopping-animation.json',
          link: '#',
          githubLink: '#',
          category: 'Web Application',
          featured: false,
        },
        */
        
      ],
      skills: this.getInitialSkills(),
      experiences: [
        {
          id: 1,
          company: 'TATA CONSULTANCY SERVICES LIMITED',
          position: 'Full Stack Developer',
          period: '2021 - Present',
          logo: 'assets/images/tcs-logo.png',
          description:
            'Worked on developing and maintaining enterprise-level applications using Angular and Spring Boot.',
          responsibilities: [
            'Developed and maintained the UI of Ignio environment using Angular',
            'Designed and developed RESTful APIs using Spring Boot',
          ],
          technologies: [
            'Angular',
            'Spring Boot',
            'Docker',
            'Jenkins',
            'MySQL',
            'REST APIs',
          ],
        },
      ],
      socialPosts: [
        {
          id: 1,
          title: 'How to Organize Your Spring Boot Project for Scalability',
          description:
            'Discover best practices for structuring your Spring Boot project.',
          link: 'https://medium.com/@thematrixxworld/how-to-organize-your-spring-boot-project',
          date: 'April 12, 2025',
          readTime: '2 min',
          likes: 245,
          platform: 'medium',
        },
      ],
      personalInfo: {
        name: 'Amol Nagare',
        title: 'Full Stack Developer',
        email: 'amolnagare279@gmail.com',
        phone: '+91 9975607503',
        education: "B.E. Computer Engineering",
        language: "English, Hindi, Marathi",
        location: 'Pune, India',
        about:
        "I am a Full Stack Developer with 4+ years of experience. I build strong and scalable full stack application. My main skills are in Angular (for the frontend) and Spring Boot (for the backend). I also have good knowledge of Microservices, DevOps, and other modern tools. I love taking complex ideas and turning them into smooth, working applications."
      },
    };
  }

  private getInitialSkills(): Skill[] {
    return [
      // Frontend Skills
      {
        id: 1,
        name: 'HTML/CSS',
        level: 90,
        color: '#E44D26',
        category: 'frontend',
      },
      {
        id: 2,
        name: 'JavaScript',
        level: 85,
        color: '#F7DF1E',
        category: 'frontend',
      },
      {
        id: 3,
        name: 'TypeScript',
        level: 88,
        color: '#3178C6',
        category: 'frontend',
      },
      {
        id: 4,
        name: 'Angular',
        level: 87,
        color: '#DD0031',
        category: 'frontend',
      },
      {
        id: 5,
        name: 'Bootstrap',
        level: 82,
        color: '#7952B3',
        category: 'frontend',
      },

      // Backend Skills
      { id: 6, name: 'Java', level: 88, color: '#ED8B00', category: 'backend' },
      {
        id: 7,
        name: 'Spring Boot',
        level: 86,
        color: '#6DB33F',
        category: 'backend',
      },
      {
        id: 8,
        name: 'Spring Framework',
        level: 85,
        color: '#6DB33F',
        category: 'backend',
      },
      {
        id: 9,
        name: 'Hibernate',
        level: 83,
        color: '#59666C',
        category: 'backend',
      },
      {
        id: 10,
        name: 'Spring Data JPA',
        level: 84,
        color: '#6DB33F',
        category: 'backend',
      },
      {
        id: 11,
        name: 'Microservices',
        level: 80,
        color: '#1890FF',
        category: 'backend',
      },
      {
        id: 12,
        name: 'RESTful APIs',
        level: 90,
        color: '#FF6B6B',
        category: 'backend',
      },

      // Database Skills
      {
        id: 13,
        name: 'PostgreSQL',
        level: 82,
        color: '#336791',
        category: 'database',
      },
      {
        id: 14,
        name: 'MySQL',
        level: 80,
        color: '#4479A1',
        category: 'database',
      },

      // DevOps & Tools
      {
        id: 15,
        name: 'Docker',
        level: 78,
        color: '#2496ED',
        category: 'devops',
      },
      {
        id: 16,
        name: 'Jenkins',
        level: 75,
        color: '#D24939',
        category: 'devops',
      },
      {
        id: 17,
        name: 'Git/GitHub',
        level: 88,
        color: '#F05032',
        category: 'devops',
      },
      {
        id: 18,
        name: 'AWS DevOps',
        level: 70,
        color: '#FF9900',
        category: 'devops',
      },
      {
        id: 19,
        name: 'Maven',
        level: 85,
        color: '#C71A36',
        category: 'devops',
      },
    ];
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
    if (
      username === this.adminCredentials.username &&
      password === this.adminCredentials.password
    ) {
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

  // ========== PROJECTS MANAGEMENT ==========
  updateProject(project: Project): void {
    const currentData = this.portfolioData.value;
    const updatedProjects = currentData.projects.map((p) =>
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
    const updatedProjects = currentData.projects.filter(
      (p) => p.id !== projectId
    );
    const newData = { ...currentData, projects: updatedProjects };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  // ========== SKILLS MANAGEMENT ==========
  updateSkill(skill: Skill): void {
    const currentData = this.portfolioData.value;
    const updatedSkills = currentData.skills.map((s) =>
      s.id === skill.id ? skill : s
    );
    const newData = { ...currentData, skills: updatedSkills };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  addSkill(skill: Skill): void {
    const currentData = this.portfolioData.value;
    const newSkill = {
      ...skill,
      id: Date.now(),
      category: skill.category.toLowerCase(),
    };
    const updatedSkills = [newSkill, ...currentData.skills];
    const newData = { ...currentData, skills: updatedSkills };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  deleteSkill(skillId: number): void {
    const currentData = this.portfolioData.value;
    const updatedSkills = currentData.skills.filter((s) => s.id !== skillId);
    const newData = { ...currentData, skills: updatedSkills };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  // ========== EXPERIENCES MANAGEMENT ==========
  updateExperience(experience: Experience): void {
    const currentData = this.portfolioData.value;
    const updatedExperiences = currentData.experiences.map((e) =>
      e.id === experience.id ? experience : e
    );
    const newData = { ...currentData, experiences: updatedExperiences };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  addExperience(experience: Experience): void {
    const currentData = this.portfolioData.value;
    const newExperience = { ...experience, id: Date.now() };
    const updatedExperiences = [newExperience, ...currentData.experiences];
    const newData = { ...currentData, experiences: updatedExperiences };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  deleteExperience(experienceId: number): void {
    const currentData = this.portfolioData.value;
    const updatedExperiences = currentData.experiences.filter(
      (e) => e.id !== experienceId
    );
    const newData = { ...currentData, experiences: updatedExperiences };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  // ========== SOCIAL POSTS MANAGEMENT ==========
  updateSocialPost(socialPost: SocialPost): void {
    const currentData = this.portfolioData.value;
    const updatedSocialPosts = currentData.socialPosts.map((sp) =>
      sp.id === socialPost.id ? socialPost : sp
    );
    const newData = { ...currentData, socialPosts: updatedSocialPosts };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  addSocialPost(socialPost: SocialPost): void {
    const currentData = this.portfolioData.value;
    const newSocialPost = { ...socialPost, id: Date.now() };
    const updatedSocialPosts = [newSocialPost, ...currentData.socialPosts];
    const newData = { ...currentData, socialPosts: updatedSocialPosts };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  deleteSocialPost(socialPostId: number): void {
    const currentData = this.portfolioData.value;
    const updatedSocialPosts = currentData.socialPosts.filter(
      (sp) => sp.id !== socialPostId
    );
    const newData = { ...currentData, socialPosts: updatedSocialPosts };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  // ========== PERSONAL INFO MANAGEMENT ==========
  updatePersonalInfo(info: any): void {
    const currentData = this.portfolioData.value;
    const newData = { ...currentData, personalInfo: info };
    this.portfolioData.next(newData);
    this.saveToLocalStorage(newData);
  }

  // ========== RESET DATA ==========
  resetToDefault(): void {
    const defaultData = this.getInitialData();
    this.portfolioData.next(defaultData);
    this.saveToLocalStorage(defaultData);
  }

  // ========== EXPORT/IMPORT DATA ==========
  exportData(): string {
    return JSON.stringify(this.portfolioData.value, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.portfolioData.next(data);
      this.saveToLocalStorage(data);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}
