export interface Project {
    id: number;
    title: string;
    description: string;
    technologies: string[];
    imageUrl: string;
    link: string;
    githubLink?: string;
    category: string;
  }
  
  export interface SocialPost {
    title: string;
    description: string;
    link: string;
    date: string;
    readTime?: string;
    likes?: number;
    views?: string;
    upvotes?: number;
    engagement?: string;
    comments?: number;
  }

  export interface Testimonial {
    name: string;
    position: string;
    text: string;
    image: string;
  }

  export interface NavItem {
    label: string;
    link: string;
    icon: string;
  }