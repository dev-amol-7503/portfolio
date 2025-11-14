export interface TutorialContent {
  id: string;
  type: 'text' | 'code' | 'image' | 'video' | 'table' | 'diagram' | 'callout';
  content: string;
  order: number;
  showPreview?: boolean;
  
  // Code specific properties
  language?: string;
  fileName?: string;
  
  // Image specific properties  
  caption?: string;
  altText?: string;
  
  // Video specific properties
  title?: string;
  
  // Table specific properties
  rows?: number;
  columns?: number;
  
  // Other metadata
  metadata?: any;
}
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
  readingTime: number;
  difficulty: string;
  bookmarks: string[];
  views: number;
  likes: number;
  
  // Roadmap related fields
  roadmapStep?: number;
  roadmapType?: 'frontend' | 'backend';
  stepTitle?: string;
  technologies: string[];
  prerequisites: string[];
  learningObjectives: string[];
  
  // NEW: Topic tracking fields
  topicOrder?: number;        // 1, 2, 3... for ordering within roadmap step
  totalTopics?: number;       // Total topics in this roadmap step
  topicTitle?: string;        // Specific topic title
}

export interface TutorialContent {
  id: string;
  type: 'text' | 'code' | 'image' | 'video' | 'callout' | 'table' | 'diagram';
  content: string;
  order: number;
  language?: string;
  fileName?: string;
  caption?: string;
  title?: string;
  metadata?: any;
  showPreview?: boolean;
}

export interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  category: 'backend' | 'frontend' | 'core';
  technologies: string[];
  topics: string[];
  tutorials: Tutorial[];
  isActive: boolean;
  isCompleted: boolean;
  order: number;
  badgeClass?: string;
  badgeText?: string;
  progressClass?: string;
  totalTopics: number;
  prerequisites?: number[]; // Previous step IDs
  estimatedHours?: number; // Estimated learning time
}



// Helper function to get roadmap step by ID
export function getRoadmapStepById(steps: RoadmapStep[], id: number): RoadmapStep | null {
  return steps.find(step => step.id === id) || null;
}

// Helper function to get tutorials for a roadmap step
export function getTutorialsForRoadmapStep(tutorials: Tutorial[], stepId: number): Tutorial[] {
  return tutorials.filter(tutorial => tutorial.roadmapStep === stepId);
}