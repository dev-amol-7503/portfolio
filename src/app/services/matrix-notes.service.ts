import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  where,
} from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import { Tutorial, TutorialContent } from '../interfaces/tutorial.model';

@Injectable({
  providedIn: 'root',
})
export class MatrixNotesService {
  private firestore = inject(Firestore);
  private toastr = inject(ToastrService);

  constructor() {
    console.log('🔄 MatrixNotesService initialized - Using Firebase only');
  }

  // Generate unique ID
  private generateId(): string {
    return (
      'tut_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    );
  }

  // Get current user ID (for author field)
  private getCurrentUserId(): string {
    return 'admin'; // Hardcoded for now, you can change this later
  }

  // Clean data by removing undefined and null values
  private cleanData(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (Array.isArray(data)) {
      return data
        .map((item) => this.cleanData(item))
        .filter((item) => item !== null && item !== undefined);
    }

    if (
      typeof data === 'object' &&
      !(data instanceof Date) &&
      !(data instanceof Timestamp)
    ) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        const cleanedValue = this.cleanData(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : null;
    }

    return data;
  }
  // Convert Firestore Timestamp to Date
  private convertToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    } else if (timestamp instanceof Date) {
      return timestamp;
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp);
    } else {
      return new Date(); // Fallback to current date
    }
  }

  // Test Firebase connection
  async testFirebaseConnection(): Promise<boolean> {
    try {
      const testDocRef = doc(
        collection(this.firestore, 'test_connection'),
        'test_doc'
      );
      await setDoc(testDocRef, {
        test: true,
        message: 'Testing Firebase connection',
        timestamp: Timestamp.now(),
      });
      await deleteDoc(testDocRef);
      console.log('✅ Firebase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  }

// FIXED: Enhanced getAllTutorials with proper roadmap field handling
async getAllTutorials(): Promise<Tutorial[]> {
  try {
    console.log('🔄 Fetching all tutorials from Firebase...');

    const tutorialsCollection = collection(this.firestore, 'tutorials');
    const q = query(tutorialsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const tutorials: Tutorial[] = [];

    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const tutorial = this.firestoreToTutorial(doc.id, data);
        
        // Ensure roadmapStep is properly converted from Firestore
        if (data['roadmapStep'] !== undefined) {
          tutorial.roadmapStep = Number(data['roadmapStep']);
        }
        
        tutorials.push(tutorial);
      } catch (error) {
        console.error(`❌ Error processing tutorial ${doc.id}:`, error);
      }
    });

    console.log(`✅ Fetched ${tutorials.length} tutorials from Firebase`);
    return tutorials;
  } catch (error: any) {
    console.error('❌ Error fetching tutorials:', error);
    throw error;
  }
}

  async getPublishedTutorials(): Promise<Tutorial[]> {
    try {
      const allTutorials = await this.getAllTutorials();
      const published = allTutorials.filter((tutorial) => tutorial.published);
      console.log(`✅ Found ${published.length} published tutorials`);
      return published;
    } catch (error: any) {
      console.error('❌ Error fetching published tutorials:', error);
      throw error;
    }
  }

  async getTutorial(tutorialId: string): Promise<Tutorial | null> {
    try {
      console.log(`🔄 Fetching tutorial: ${tutorialId}`);

      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        console.log(`❌ Tutorial not found: ${tutorialId}`);
        return null;
      }

      const tutorial = this.firestoreToTutorial(
        docSnapshot.id,
        docSnapshot.data()
      );
      console.log(`✅ Tutorial fetched successfully: ${tutorial.title}`);
      return tutorial;
    } catch (error: any) {
      console.error(`❌ Error fetching tutorial ${tutorialId}:`, error);
      this.toastr.error(`Failed to fetch tutorial: ${error.message}`);
      throw error;
    }
  }

  async updateTutorial(
    tutorialId: string,
    updates: Partial<Tutorial>
  ): Promise<void> {
    try {
      console.log(`🔄 Updating tutorial: ${tutorialId}`);

      // Remove id from updates as it shouldn't be changed
      const { id, ...updateData } = updates;

      // Prepare update data with proper cleaning
      const firebaseUpdateData: any = {
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Add only the fields that are provided and not undefined
      if (updateData.title !== undefined)
        firebaseUpdateData.title = updateData.title;
      if (updateData.description !== undefined)
        firebaseUpdateData.description = updateData.description;
      if (updateData.content !== undefined)
        firebaseUpdateData.content = updateData.content;
      if (updateData.tags !== undefined)
        firebaseUpdateData.tags = updateData.tags;
      if (updateData.category !== undefined)
        firebaseUpdateData.category = updateData.category;
      if (updateData.published !== undefined)
        firebaseUpdateData.published = updateData.published;
      if (updateData.featured !== undefined)
        firebaseUpdateData.featured = updateData.featured;
      if (updateData.readingTime !== undefined)
        firebaseUpdateData.readingTime = updateData.readingTime;
      if (updateData.difficulty !== undefined)
        firebaseUpdateData.difficulty = updateData.difficulty;
      if (updateData.views !== undefined)
        firebaseUpdateData.views = updateData.views;
      if (updateData.likes !== undefined)
        firebaseUpdateData.likes = updateData.likes;

      // Clean the data before saving
      const cleanedData = this.cleanData(firebaseUpdateData);

      console.log('📝 Updating tutorial with data:', cleanedData);

      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      await updateDoc(docRef, cleanedData);

      console.log(`✅ Tutorial updated successfully: ${tutorialId}`);
      this.toastr.success('Tutorial updated successfully');
    } catch (error: any) {
      console.error(`❌ Error updating tutorial ${tutorialId}:`, error);
      this.toastr.error(`Failed to update tutorial: ${error.message}`);
      throw error;
    }
  }

  async deleteTutorial(tutorialId: string): Promise<void> {
    try {
      console.log(`🔄 Deleting tutorial: ${tutorialId}`);

      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      await deleteDoc(docRef);

      console.log(`✅ Tutorial deleted successfully: ${tutorialId}`);
      this.toastr.success('Tutorial deleted successfully');
    } catch (error: any) {
      console.error(`❌ Error deleting tutorial ${tutorialId}:`, error);
      this.toastr.error(`Failed to delete tutorial: ${error.message}`);
      throw error;
    }
  }

  async publishTutorial(tutorialId: string): Promise<void> {
    try {
      console.log(`🔄 Publishing tutorial: ${tutorialId}`);

      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      await updateDoc(docRef, {
        published: true,
        publishedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      console.log(`✅ Tutorial published successfully: ${tutorialId}`);
      this.toastr.success('Tutorial published successfully');
    } catch (error: any) {
      console.error(`❌ Error publishing tutorial ${tutorialId}:`, error);
      this.toastr.error(`Failed to publish tutorial: ${error.message}`);
      throw error;
    }
  }

  async unpublishTutorial(tutorialId: string): Promise<void> {
    try {
      console.log(`🔄 Unpublishing tutorial: ${tutorialId}`);

      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      await updateDoc(docRef, {
        published: false,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      console.log(`✅ Tutorial unpublished successfully: ${tutorialId}`);
      this.toastr.success('Tutorial unpublished successfully');
    } catch (error: any) {
      console.error(`❌ Error unpublishing tutorial ${tutorialId}:`, error);
      this.toastr.error(`Failed to unpublish tutorial: ${error.message}`);
      throw error;
    }
  }

  // ========== ANALYTICS ==========

  async incrementViews(tutorialId: string): Promise<void> {
    try {
      const tutorial = await this.getTutorial(tutorialId);
      if (tutorial) {
        await this.updateTutorial(tutorialId, {
          views: (tutorial.views || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async incrementLikes(tutorialId: string): Promise<void> {
    try {
      const tutorial = await this.getTutorial(tutorialId);
      if (tutorial) {
        await this.updateTutorial(tutorialId, {
          likes: (tutorial.likes || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  }

// matrix-notes.service.ts mai yeh method update karen

// FIXED: Get tutorials by roadmap step with topic ordering
async getTutorialsByRoadmapStep(stepId: number): Promise<Tutorial[]> {
  try {
    console.log(`🔄 Fetching tutorials for step ${stepId}`);
    
    const allTutorials = await this.getAllTutorials();
    
    // Filter tutorials by roadmap step
    const filteredTutorials = allTutorials.filter(tutorial => {
      const matchesStep = tutorial.roadmapStep === stepId;
      const isPublished = tutorial.published === true;
      return matchesStep && isPublished;
    });
    
    // Sort by topicOrder if available, otherwise by creation date
    filteredTutorials.sort((a, b) => {
      if (a.topicOrder && b.topicOrder) {
        return a.topicOrder - b.topicOrder;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    console.log(`✅ Found ${filteredTutorials.length} tutorials for step ${stepId}`);
    return filteredTutorials;

  } catch (error: any) {
    console.error(`❌ Error fetching tutorials for roadmap step ${stepId}:`, error);
    throw error;
  }
}

// FIXED: Get single tutorial by roadmap step
async getTutorialByRoadmapStep(stepId: number): Promise<Tutorial | null> {
  try {
    const tutorials = await this.getTutorialsByRoadmapStep(stepId);
    return tutorials.length > 0 ? tutorials[0] : null;
  } catch (error: any) {
    console.error(`❌ Error getting tutorial for roadmap step ${stepId}:`, error);
    return null;
  }
}

// matrix-notes.service.ts - ADD DEBUGGING METHOD

// Debug method to check roadmap step mappings
async debugRoadmapStepMappings(): Promise<void> {
  try {
    console.log('🔍 DEBUG: Checking roadmap step mappings...');
    
    const allTutorials = await this.getAllTutorials();
    const publishedTutorials = allTutorials.filter(t => t.published);
    
    console.log(`📊 Total tutorials: ${allTutorials.length}`);
    console.log(`📊 Published tutorials: ${publishedTutorials.length}`);
    
    // Check tutorials with roadmap steps
    const tutorialsWithRoadmap = publishedTutorials.filter(t => t.roadmapStep);
    console.log(`📍 Tutorials with roadmap steps: ${tutorialsWithRoadmap.length}`);
    
    // Group by roadmap step
    const stepMap: {[key: number]: Tutorial[]} = {};
    tutorialsWithRoadmap.forEach(tutorial => {
      if (tutorial.roadmapStep) {
        if (!stepMap[tutorial.roadmapStep]) {
          stepMap[tutorial.roadmapStep] = [];
        }
        stepMap[tutorial.roadmapStep].push(tutorial);
      }
    });
    
    console.log('📋 Roadmap Step Mapping Summary:');
    Object.keys(stepMap).forEach(stepId => {
      console.log(`  Step ${stepId}: ${stepMap[parseInt(stepId)].length} tutorials`);
      stepMap[parseInt(stepId)].forEach(t => {
        console.log(`    - ${t.title} (ID: ${t.id})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// FIXED: Check if tutorial exists for step
async hasTutorialForStep(stepId: number): Promise<boolean> {
  try {
    const tutorials = await this.getTutorialsByRoadmapStep(stepId);
    return tutorials.length > 0;
  } catch (error) {
    console.error(`❌ Error checking tutorial for step ${stepId}:`, error);
    return false;
  }
}

// FIXED: Remove roadmapType parameter from getRoadmapStepsWithTutorials
async getRoadmapStepsWithTutorials(): Promise<{stepId: number, hasTutorial: boolean, tutorial?: Tutorial}[]> {
  try {
    // Define your roadmap steps (adjust according to your roadmap structure)
    const backendSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const frontendSteps = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const allStepIds = [...backendSteps, ...frontendSteps];

    const stepsWithTutorials = [];

    for (const stepId of allStepIds) {
      const tutorials = await this.getTutorialsByRoadmapStep(stepId);
      stepsWithTutorials.push({
        stepId,
        hasTutorial: tutorials.length > 0,
        tutorial: tutorials.length > 0 ? tutorials[0] : undefined
      });
    }

    return stepsWithTutorials;
  } catch (error: any) {
    console.error(`❌ Error getting roadmap steps with tutorials:`, error);
    throw error;
  }
}
  // Create tutorial with roadmap step information
  async createTutorialForRoadmapStep(
    tutorialData: Partial<Tutorial>,
    stepId: number,
    roadmapType: 'frontend' | 'backend',
    stepTitle: string
  ): Promise<string> {
    try {
      const tutorialWithRoadmap = {
        ...tutorialData,
        roadmapStep: stepId,
        roadmapType: roadmapType,
        stepTitle: stepTitle,
        published: true, // Auto-publish roadmap tutorials
      };

      return await this.createTutorial(tutorialWithRoadmap);
    } catch (error: any) {
      console.error(
        `❌ Error creating tutorial for roadmap step ${stepId}:`,
        error
      );
      throw error;
    }
  }

  // Get roadmap progress data
  async getRoadmapProgress(): Promise<any> {
    try {
      const tutorials = await this.getAllTutorials();
      const publishedTutorials = tutorials.filter((t) => t.published);

      // Calculate progress for each roadmap step
      const progressData = {
        totalTutorials: tutorials.length,
        publishedTutorials: publishedTutorials.length,
        totalViews: tutorials.reduce((sum, t) => sum + (t.views || 0), 0),
        totalLikes: tutorials.reduce((sum, t) => sum + (t.likes || 0), 0),
        byCategory: this.groupTutorialsByCategory(tutorials),
        byDifficulty: this.groupTutorialsByDifficulty(tutorials),
      };

      return progressData;
    } catch (error: any) {
      console.error('Error getting roadmap progress:', error);
      throw error;
    }
  }

  // Helper methods
  private groupTutorialsByCategory(tutorials: Tutorial[]): any {
    const categories: any = {};
    tutorials.forEach((tutorial) => {
      if (!categories[tutorial.category]) {
        categories[tutorial.category] = 0;
      }
      categories[tutorial.category]++;
    });
    return categories;
  }

  private groupTutorialsByDifficulty(tutorials: Tutorial[]): any {
    const difficulties: any = {};
    tutorials.forEach((tutorial) => {
      if (!difficulties[tutorial.difficulty]) {
        difficulties[tutorial.difficulty] = 0;
      }
      difficulties[tutorial.difficulty]++;
    });
    return difficulties;
  }

  // ========== UTILITY METHODS ==========

  async getTutorialsCount(): Promise<number> {
    try {
      const tutorials = await this.getAllTutorials();
      return tutorials.length;
    } catch (error) {
      console.error('Error getting tutorials count:', error);
      return 0;
    }
  }

  async getDatabaseInfo(): Promise<any> {
    try {
      const tutorials = await this.getAllTutorials();
      const published = tutorials.filter((t) => t.published);
      const drafts = tutorials.filter((t) => !t.published);

      return {
        totalTutorials: tutorials.length,
        publishedTutorials: published.length,
        draftTutorials: drafts.length,
        totalViews: tutorials.reduce((sum, t) => sum + (t.views || 0), 0),
        totalLikes: tutorials.reduce((sum, t) => sum + (t.likes || 0), 0),
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }

  // matrix-notes.service.ts - UPDATE FIREBASE SCHEMA

// FIXED: Convert Firestore data to Tutorial object - ADD ROADMAP FIELDS
private firestoreToTutorial(docId: string, data: any): Tutorial {
  return {
    id: docId,
    title: data['title'] || 'Untitled Tutorial',
    description: data['description'] || '',
    content: data['content'] || [],
    tags: data['tags'] || [],
    category: data['category'] || 'general',
    author: data['author'] || this.getCurrentUserId(),
    published: data['published'] || false,
    featured: data['featured'] || false,
    createdAt: this.convertToDate(data['createdAt']),
    updatedAt: this.convertToDate(data['updatedAt']),
    readingTime: data['readingTime'] || 5,
    difficulty: data['difficulty'] || 'beginner',
    bookmarks: data['bookmarks'] || [],
    views: data['views'] || 0,
    likes: data['likes'] || 0,
    // ADD ROADMAP FIELDS
    roadmapStep: data['roadmapStep'] || undefined,
    roadmapType: data['roadmapType'] || undefined,
    stepTitle: data['stepTitle'] || undefined,
    technologies: data['technologies'] || [],
    prerequisites: data['prerequisites'] || [],
    learningObjectives: data['learningObjectives'] || [],
  };
}

// FIXED: Enhanced createTutorial to ensure data consistency
async createTutorial(tutorialData: Partial<Tutorial>): Promise<string> {
  try {
    const tutorialId = this.generateId();

    // Convert roadmapStep to number to ensure type consistency
    const roadmapStep = tutorialData.roadmapStep ? Number(tutorialData.roadmapStep) : undefined;

    const tutorial: Tutorial = {
      id: tutorialId,
      title: tutorialData.title || 'Untitled Tutorial',
      description: tutorialData.description || '',
      content: tutorialData.content || [],
      tags: tutorialData.tags || [],
      category: tutorialData.category || 'general',
      author: tutorialData.author || this.getCurrentUserId(),
      published: tutorialData.published || false,
      featured: tutorialData.featured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      readingTime: tutorialData.readingTime || 5,
      difficulty: tutorialData.difficulty || 'beginner',
      bookmarks: tutorialData.bookmarks || [],
      views: tutorialData.views || 0,
      likes: tutorialData.likes || 0,
      // ENSURE PROPER DATA TYPES
      roadmapStep: roadmapStep,
      roadmapType: tutorialData.roadmapType,
      stepTitle: tutorialData.stepTitle,
      technologies: tutorialData.technologies || [],
      prerequisites: tutorialData.prerequisites || [],
      learningObjectives: tutorialData.learningObjectives || [],
    };

    // Prepare Firebase data with proper Timestamps
    const firebaseData = {
      title: tutorial.title,
      description: tutorial.description,
      content: tutorial.content.map((item) => ({
        id: item.id || this.generateId(),
        type: item.type || 'text',
        content: item.content || '',
        order: item.order || 0,
        language: item.language || '',
        fileName: item.fileName || '',
        caption: item.caption || '',
        title: item.title || '',
        metadata: item.metadata || {},
        showPreview: item.showPreview || false,
      })),
      tags: tutorial.tags,
      category: tutorial.category,
      author: tutorial.author,
      published: tutorial.published,
      featured: tutorial.featured,
      createdAt: Timestamp.fromDate(tutorial.createdAt),
      updatedAt: Timestamp.fromDate(tutorial.updatedAt),
      readingTime: tutorial.readingTime,
      difficulty: tutorial.difficulty,
      bookmarks: tutorial.bookmarks,
      views: tutorial.views,
      likes: tutorial.likes,
      roadmapStep: roadmapStep,
      roadmapType: tutorial.roadmapType,
      stepTitle: tutorial.stepTitle,
      technologies: tutorial.technologies,
      prerequisites: tutorial.prerequisites,
      learningObjectives: tutorial.learningObjectives,
    };
const cleanedData = this.cleanData(firebaseData);
    const docRef = doc(this.firestore, 'tutorials', tutorialId);
    await setDoc(docRef, cleanedData);

    console.log('✅ Tutorial creat Fed with roadmap step:', roadmapStep);
    return tutorialId;
  } catch (error: any) {
    console.error('❌ Error creating tutorial:', error);
    throw error;
  }
}
}
