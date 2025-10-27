// social-post.model.ts
export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  animationUrl?: string;
  link: string;
  githubLink?: string;
  category: string;
  featured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SocialPost {
  id: number;
  platform: 'medium' | 'quora' | 'linkedin';
  title: string;
  description: string;
  link: string;
  date: string;
  likes?: number;
  upvotes?: number;
  comments?: number;
  views?: number;
  engagement?: number;
  readTime?: string;
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
  id?: number;
  name: string;
  level: number;
  color: string;
  category: string;
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