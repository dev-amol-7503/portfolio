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
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove
} from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import { Tutorial, TutorialContent, TutorialComment, TutorialBookmark } from '../interfaces/tutorial.model';

@Injectable({
  providedIn: 'root'
})
export class MatrixNotesService {
  private firestore = inject(Firestore);
  private toastr = inject(ToastrService);
  
  private useLocalStorage = false; // Start with Firebase, fallback to localStorage if needed
  private readonly LOCAL_STORAGE_KEY = 'matrix_notes_tutorials';
  private readonly LOCAL_STORAGE_COMMENTS_KEY = 'matrix_notes_comments';
  private readonly LOCAL_STORAGE_BOOKMARKS_KEY = 'matrix_notes_bookmarks';

  // Tutorial Collections
  private tutorialsCollection = collection(this.firestore, 'tutorials');
  private commentsCollection = collection(this.firestore, 'tutorial_comments');
  private bookmarksCollection = collection(this.firestore, 'tutorial_bookmarks');

  constructor() {
    this.testFirebaseConnection();
  }

  // Test Firebase connection on service initialization
  // In your testFirebaseConnection method
private async testFirebaseConnection(): Promise<void> {
  try {
    // Check if Firebase is configured
    if (!this.firestore) {
      throw new Error('Firestore not available');
    }
    
    const testQuery = query(this.tutorialsCollection, limit(1));
    await getDocs(testQuery);
    console.log('Firebase connection successful');
    this.useLocalStorage = false;
  } catch (error) {
    console.error('Firebase connection failed, using localStorage:', error);
    this.useLocalStorage = true;
    this.toastr.warning('Using local storage mode for tutorials');
  }
}

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get current user ID (demo version without auth)
  private getCurrentUserId(): string {
    let userId = localStorage.getItem('matrix_notes_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('matrix_notes_user_id', userId);
    }
    return userId;
  }

  // Deep clean function to remove all undefined values recursively
  private deepCleanObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return undefined;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCleanObject(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.deepCleanObject(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }
    
    return obj;
  }

  // ========== LOCAL STORAGE METHODS ==========

  private getTutorialsFromLocalStorage(): Tutorial[] {
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private saveTutorialsToLocalStorage(tutorials: Tutorial[]): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(tutorials));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private getCommentsFromLocalStorage(): TutorialComment[] {
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_COMMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading comments from localStorage:', error);
      return [];
    }
  }

  private saveCommentsToLocalStorage(comments: TutorialComment[]): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(comments));
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
    }
  }

  // ========== TUTORIAL CRUD OPERATIONS ==========

  async createTutorial(tutorialData: Partial<Tutorial>): Promise<string> {
    if (this.useLocalStorage) {
      return this.createTutorialLocalStorage(tutorialData);
    }

    try {
      return await this.createTutorialFirebase(tutorialData);
    } catch (error) {
      console.warn('Firebase failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      this.toastr.warning('Switched to local storage mode');
      return this.createTutorialLocalStorage(tutorialData);
    }
  }

  private async createTutorialFirebase(tutorialData: Partial<Tutorial>): Promise<string> {
    const tutorialId = this.generateId();
    
    const tutorial: Tutorial = {
      id: tutorialId,
      title: tutorialData.title || 'Untitled Tutorial',
      description: tutorialData.description || '',
      content: (tutorialData.content || []).map(item => ({
        id: item.id || Date.now().toString(),
        type: item.type || 'text',
        content: item.content || '',
        order: item.order || 0,
        language: item.language,
        metadata: item.metadata
      })),
      tags: tutorialData.tags || [],
      category: tutorialData.category || 'general',
      author: tutorialData.author || 'admin',
      published: tutorialData.published || false,
      featured: tutorialData.featured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      readingTime: tutorialData.readingTime || 5,
      difficulty: tutorialData.difficulty || 'beginner',
      coverImage: tutorialData.coverImage,
      bookmarks: [],
      views: 0,
      likes: 0
    };

    const firebaseData = {
      ...tutorial,
      createdAt: Timestamp.fromDate(tutorial.createdAt),
      updatedAt: Timestamp.fromDate(tutorial.updatedAt)
    };

    const cleanedData = this.deepCleanObject(firebaseData);

    console.log('Creating tutorial in Firebase with data:', cleanedData);

    const docRef = doc(this.firestore, 'tutorials', tutorialId);
    await setDoc(docRef, cleanedData);

    this.toastr.success('Tutorial created successfully in Firebase');
    return tutorialId;
  }

  private createTutorialLocalStorage(tutorialData: Partial<Tutorial>): string {
    const tutorialId = this.generateId();
    
    const tutorial: Tutorial = {
      id: tutorialId,
      title: tutorialData.title || 'Untitled Tutorial',
      description: tutorialData.description || '',
      content: tutorialData.content || [],
      tags: tutorialData.tags || [],
      category: tutorialData.category || 'general',
      author: tutorialData.author || 'admin',
      published: tutorialData.published || false,
      featured: tutorialData.featured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      readingTime: tutorialData.readingTime || 5,
      difficulty: tutorialData.difficulty || 'beginner',
      coverImage: tutorialData.coverImage,
      bookmarks: [],
      views: 0,
      likes: 0
    };

    const tutorials = this.getTutorialsFromLocalStorage();
    tutorials.push(tutorial);
    this.saveTutorialsToLocalStorage(tutorials);

    this.toastr.success('Tutorial created successfully in local storage');
    return tutorialId;
  }

  async getAllTutorials(): Promise<Tutorial[]> {
    if (this.useLocalStorage) {
      return this.getTutorialsFromLocalStorage();
    }

    try {
      const q = query(this.tutorialsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data['id'],
          title: data['title'],
          description: data['description'],
          content: data['content'] || [],
          tags: data['tags'] || [],
          category: data['category'],
          author: data['author'],
          published: data['published'],
          featured: data['featured'],
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate(),
          publishedAt: data['publishedAt']?.toDate(),
          readingTime: data['readingTime'],
          difficulty: data['difficulty'],
          coverImage: data['coverImage'],
          bookmarks: data['bookmarks'] || [],
          views: data['views'] || 0,
          likes: data['likes'] || 0
        } as Tutorial;
      });
    } catch (error) {
      console.warn('Firebase failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      return this.getTutorialsFromLocalStorage();
    }
  }

  async getPublishedTutorials(): Promise<Tutorial[]> {
    const tutorials = await this.getAllTutorials();
    return tutorials.filter(tutorial => tutorial.published);
  }

  // Add other methods with similar fallback patterns...

  async getTutorial(tutorialId: string): Promise<Tutorial | null> {
    if (this.useLocalStorage) {
      const tutorials = this.getTutorialsFromLocalStorage();
      return tutorials.find(t => t.id === tutorialId) || null;
    }

    try {
      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = docSnapshot.data();
      return {
        id: data['id'],
        title: data['title'],
        description: data['description'],
        content: data['content'] || [],
        tags: data['tags'] || [],
        category: data['category'],
        author: data['author'],
        published: data['published'],
        featured: data['featured'],
        createdAt: data['createdAt']?.toDate(),
        updatedAt: data['updatedAt']?.toDate(),
        publishedAt: data['publishedAt']?.toDate(),
        readingTime: data['readingTime'],
        difficulty: data['difficulty'],
        coverImage: data['coverImage'],
        bookmarks: data['bookmarks'] || [],
        views: data['views'] || 0,
        likes: data['likes'] || 0
      } as Tutorial;
    } catch (error) {
      console.warn('Firebase failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      const tutorials = this.getTutorialsFromLocalStorage();
      return tutorials.find(t => t.id === tutorialId) || null;
    }
  }

  // Add other CRUD methods with similar patterns...

  // Simple implementation for other methods in localStorage mode
  async updateTutorial(tutorialId: string, updates: Partial<Tutorial>): Promise<void> {
    if (this.useLocalStorage) {
      const tutorials = this.getTutorialsFromLocalStorage();
      const index = tutorials.findIndex(t => t.id === tutorialId);
      if (index !== -1) {
        tutorials[index] = { ...tutorials[index], ...updates, updatedAt: new Date() };
        this.saveTutorialsToLocalStorage(tutorials);
      }
      return;
    }

    try {
      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      const cleanedUpdates = this.deepCleanObject({
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
      await updateDoc(docRef, cleanedUpdates);
    } catch (error) {
      console.warn('Firebase failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      await this.updateTutorial(tutorialId, updates); // Recursive call with localStorage
    }
  }

  async deleteTutorial(tutorialId: string): Promise<void> {
    if (this.useLocalStorage) {
      const tutorials = this.getTutorialsFromLocalStorage();
      const filtered = tutorials.filter(t => t.id !== tutorialId);
      this.saveTutorialsToLocalStorage(filtered);
      return;
    }

    try {
      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firebase failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      await this.deleteTutorial(tutorialId); // Recursive call with localStorage
    }
  }

  async publishTutorial(tutorialId: string): Promise<void> {
  if (this.useLocalStorage) {
    const tutorials = this.getTutorialsFromLocalStorage();
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      tutorial.published = true;
      tutorial.publishedAt = new Date();
      tutorial.updatedAt = new Date();
      this.saveTutorialsToLocalStorage(tutorials);
      this.toastr.success('Tutorial published successfully');
    } else {
      this.toastr.error('Tutorial not found');
      throw new Error('Tutorial not found');
    }
    return;
  }

  try {
    const docRef = doc(this.firestore, 'tutorials', tutorialId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      this.toastr.error('Tutorial not found');
      throw new Error('Tutorial not found');
    }

    await updateDoc(docRef, {
      published: true,
      publishedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    });
    this.toastr.success('Tutorial published successfully');
  } catch (error) {
    console.error('Error publishing tutorial:', error);
    this.toastr.error('Failed to publish tutorial');
    throw error;
  }
}

async unpublishTutorial(tutorialId: string): Promise<void> {
  if (this.useLocalStorage) {
    const tutorials = this.getTutorialsFromLocalStorage();
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      tutorial.published = false;
      tutorial.updatedAt = new Date();
      this.saveTutorialsToLocalStorage(tutorials);
      this.toastr.success('Tutorial unpublished successfully');
    } else {
      this.toastr.error('Tutorial not found');
      throw new Error('Tutorial not found');
    }
    return;
  }

  try {
    const docRef = doc(this.firestore, 'tutorials', tutorialId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      this.toastr.error('Tutorial not found');
      throw new Error('Tutorial not found');
    }

    await updateDoc(docRef, {
      published: false,
      updatedAt: Timestamp.fromDate(new Date())
    });
    this.toastr.success('Tutorial unpublished successfully');
  } catch (error) {
    console.error('Error unpublishing tutorial:', error);
    this.toastr.error('Failed to unpublish tutorial');
    throw error;
  }
}

  // ========== CONTENT MANAGEMENT ==========

  async addContentToTutorial(tutorialId: string, content: TutorialContent): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      const cleanedContent = this.deepCleanObject(content);
      await updateDoc(docRef, {
        content: arrayUnion(cleanedContent),
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error adding content:', error);
      throw error;
    }
  }

  // ========== COMMENTS ==========

  async addComment(tutorialId: string, comment: Partial<TutorialComment>): Promise<string> {
    try {
      const commentId = this.generateId();
      const newComment: TutorialComment = {
        id: commentId,
        tutorialId,
        userId: comment.userId || this.getCurrentUserId(),
        userName: comment.userName || 'Anonymous User',
        content: comment.content || '',
        createdAt: new Date(),
        parentId: comment.parentId // Keep as undefined if not provided
      };

      const cleanedComment = this.deepCleanObject(newComment);
      const docRef = doc(this.firestore, 'tutorial_comments', commentId);
      await setDoc(docRef, {
        ...cleanedComment,
        createdAt: Timestamp.fromDate(newComment.createdAt)
      });

      return commentId;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(tutorialId: string): Promise<TutorialComment[]> {
    try {
      const q = query(
        this.commentsCollection,
        where('tutorialId', '==', tutorialId),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data['id'],
          tutorialId: data['tutorialId'],
          userId: data['userId'],
          userName: data['userName'],
          content: data['content'],
          createdAt: data['createdAt']?.toDate(),
          parentId: data['parentId'] // Will be undefined if not present
        } as TutorialComment;
      });
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // ========== BOOKMARKS ==========

  async toggleBookmark(tutorialId: string, userId?: string): Promise<boolean> {
    try {
      const actualUserId = userId || this.getCurrentUserId();
      const bookmarkId = `${actualUserId}_${tutorialId}`;
      const bookmarkRef = doc(this.firestore, 'tutorial_bookmarks', bookmarkId);
      const bookmarkSnap = await getDoc(bookmarkRef);

      if (bookmarkSnap.exists()) {
        // Remove bookmark
        await deleteDoc(bookmarkRef);
        
        // Remove from tutorial's bookmarks array
        const tutorialRef = doc(this.firestore, 'tutorials', tutorialId);
        await updateDoc(tutorialRef, {
          bookmarks: arrayRemove(actualUserId)
        });
        
        return false; // bookmark removed
      } else {
        // Add bookmark
        const bookmark: TutorialBookmark = {
          id: bookmarkId,
          tutorialId,
          userId: actualUserId,
          createdAt: new Date()
        };

        const cleanedBookmark = this.deepCleanObject(bookmark);
        await setDoc(bookmarkRef, {
          ...cleanedBookmark,
          createdAt: Timestamp.fromDate(bookmark.createdAt)
        });

        // Add to tutorial's bookmarks array
        const tutorialRef = doc(this.firestore, 'tutorials', tutorialId);
        await updateDoc(tutorialRef, {
          bookmarks: arrayUnion(actualUserId)
        });

        return true; // bookmark added
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }

  async isBookmarked(tutorialId: string, userId?: string): Promise<boolean> {
    try {
      const actualUserId = userId || this.getCurrentUserId();
      const bookmarkId = `${actualUserId}_${tutorialId}`;
      const bookmarkRef = doc(this.firestore, 'tutorial_bookmarks', bookmarkId);
      const bookmarkSnap = await getDoc(bookmarkRef);
      return bookmarkSnap.exists();
    } catch (error) {
      console.error('Error checking bookmark:', error);
      return false;
    }
  }

  async getUserBookmarks(userId?: string): Promise<TutorialBookmark[]> {
    try {
      const actualUserId = userId || this.getCurrentUserId();
      const q = query(
        this.bookmarksCollection,
        where('userId', '==', actualUserId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data['id'],
          tutorialId: data['tutorialId'],
          userId: data['userId'],
          createdAt: data['createdAt']?.toDate()
        } as TutorialBookmark;
      });
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      throw error;
    }
  }

  // ========== SEARCH ==========

  async searchTutorials(queryText: string): Promise<Tutorial[]> {
    try {
      const allTutorials = await this.getPublishedTutorials();
      
      return allTutorials.filter(tutorial => 
        tutorial.title.toLowerCase().includes(queryText.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(queryText.toLowerCase()) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(queryText.toLowerCase())) ||
        tutorial.category.toLowerCase().includes(queryText.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching tutorials:', error);
      throw error;
    }
  }

  // ========== ANALYTICS ==========

  async incrementViews(tutorialId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      const tutorial = await this.getTutorial(tutorialId);
      
      if (tutorial) {
        await updateDoc(docRef, {
          views: (tutorial.views || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async incrementLikes(tutorialId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutorials', tutorialId);
      const tutorial = await this.getTutorial(tutorialId);
      
      if (tutorial) {
        await updateDoc(docRef, {
          likes: (tutorial.likes || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  }
}