export interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: TutorialContent[];
  tags: string[];
  category: string;
  author: string;
  published: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  readingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  coverImage?: string;
  bookmarks: string[];
  views: number;
  likes: number;
}

// In your tutorial.model.ts
export interface TutorialContent {
  id: string;
  type: 'text' | 'code' | 'image' | 'video' | 'diagram' | 'callout' | 'table';
  content: string;
  order: number;
  language?: string;
  fileName?: string;
  caption?: string;
  title?: string;
  metadata?: any;
  showPreview?: boolean; // Add this line
}

export interface TutorialComment {
  id: string;
  tutorialId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  parentId?: string;
}

export interface TutorialBookmark {
  id: string;
  tutorialId: string;
  userId: string;
  createdAt: Date;
}
