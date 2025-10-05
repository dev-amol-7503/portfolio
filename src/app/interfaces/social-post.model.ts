export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  link: string;
  githubLink?: string;
  category: string;
  featured?: boolean;
}

export interface SocialPost {
  id: number;
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
  platform: 'medium' | 'quora' | 'linkedin';
}

export interface Testimonial {
  id: number;
  name: string;
  position: string;
  text: string;
  image: string;
  rating: number;
}

export interface NavItem {
  label: string;
  link: string;
  icon: string;
}

export interface Skill {
  name: string;
  level: number;
  color: string;
  category: 'frontend' | 'backend' | 'tools';
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  period: string;
  logo: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
}