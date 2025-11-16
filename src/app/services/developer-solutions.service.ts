// services/developer-solutions.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  updateDoc,
  where,
  collectionData,
  limit
} from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, from, map } from 'rxjs';

export interface DeveloperSolution {
  id?: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  published: boolean;
  featured: boolean;
  author: string;
  views: number;
  likes: number;
  codeSnippet?: string;
  solutionSteps?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DeveloperSolutionsService {
  private firestore = inject(Firestore);
  private toastr = inject(ToastrService);
  
  private solutionsSubject = new BehaviorSubject<DeveloperSolution[]>([]);
  public solutions$ = this.solutionsSubject.asObservable();

  private solutionsCollection = collection(this.firestore, 'developer-solutions');

  constructor() {
    console.log('🔄 DeveloperSolutionsService initialized');
    this.initializeService();
  }

  private async initializeService() {
    try {
      // Test connection first
      const isConnected = await this.testFirebaseConnection();
      if (isConnected) {
        await this.loadAllSolutions();
      } else {
        console.error('❌ Cannot initialize service - No database connection');
        this.toastr.error('Cannot connect to database. Please check your connection.');
      }
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
    }
  }

  // Create new solution
  async createSolution(solutionData: Omit<DeveloperSolution, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes'>): Promise<string> {
    try {
      // Test connection first
      const isConnected = await this.testFirebaseConnection();
      if (!isConnected) {
        throw new Error('No database connection');
      }

      const id = doc(this.solutionsCollection).id;
      const newSolution: DeveloperSolution = {
        ...solutionData,
        id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        views: 0,
        likes: 0
      };

      const docRef = doc(this.firestore, 'developer-solutions', id);
      await setDoc(docRef, newSolution);
      
      this.toastr.success('Solution created successfully!');
      await this.loadAllSolutions();
      return id;
    } catch (error: any) {
      console.error('Error creating solution:', error);
      const errorMessage = error.message || 'Failed to create solution';
      this.toastr.error(errorMessage);
      throw error;
    }
  }

  // Update solution
  async updateSolution(id: string, solutionData: Partial<DeveloperSolution>): Promise<void> {
    try {
      const isConnected = await this.testFirebaseConnection();
      if (!isConnected) {
        throw new Error('No database connection');
      }

      const docRef = doc(this.firestore, 'developer-solutions', id);
      
      // Check if document exists
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error('Solution not found');
      }

      const updateData = {
        ...solutionData,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(docRef, updateData);
      
      this.toastr.success('Solution updated successfully!');
      await this.loadAllSolutions();
    } catch (error: any) {
      console.error('Error updating solution:', error);
      const errorMessage = error.message || 'Failed to update solution';
      this.toastr.error(errorMessage);
      throw error;
    }
  }

  // Delete solution
  async deleteSolution(id: string): Promise<void> {
    try {
      const isConnected = await this.testFirebaseConnection();
      if (!isConnected) {
        throw new Error('No database connection');
      }

      const docRef = doc(this.firestore, 'developer-solutions', id);
      
      // Check if document exists
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error('Solution not found');
      }

      await deleteDoc(docRef);
      
      this.toastr.success('Solution deleted successfully!');
      await this.loadAllSolutions();
    } catch (error: any) {
      console.error('Error deleting solution:', error);
      const errorMessage = error.message || 'Failed to delete solution';
      this.toastr.error(errorMessage);
      throw error;
    }
  }

  // Get all solutions
  async loadAllSolutions(): Promise<void> {
    try {
      console.log('🔄 Loading all solutions...');
      
      const q = query(
        this.solutionsCollection,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const solutions: DeveloperSolution[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        solutions.push({
          ...data,
          id: doc.id
        } as DeveloperSolution);
      });
      
      console.log(`✅ Loaded ${solutions.length} solutions`);
      this.solutionsSubject.next(solutions);
    } catch (error: any) {
      console.error('Error loading solutions:', error);
      const errorMessage = error.message || 'Failed to load solutions';
      this.toastr.error(errorMessage);
      // Don't throw error here to prevent breaking the app
    }
  }

  // Get solution by ID
  async getSolution(id: string): Promise<DeveloperSolution | null> {
    try {
      const isConnected = await this.testFirebaseConnection();
      if (!isConnected) {
        throw new Error('No database connection');
      }

      const docRef = doc(this.firestore, 'developer-solutions', id);
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        return {
          ...data,
          id: docSnapshot.id
        } as DeveloperSolution;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting solution:', error);
      const errorMessage = error.message || 'Failed to load solution';
      this.toastr.error(errorMessage);
      throw error;
    }
  }

  // Get solution by ID as Observable
  getSolution$(id: string): Observable<DeveloperSolution | null> {
    const docRef = doc(this.firestore, 'developer-solutions', id);
    return from(getDoc(docRef)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          return {
            ...data,
            id: docSnapshot.id
          } as DeveloperSolution;
        }
        return null;
      })
    );
  }

  // Test Firebase connection - IMPROVED
  async testFirebaseConnection(): Promise<boolean> {
    try {
      console.log('🔄 Testing Firebase connection...');
      
      // Method 1: Try to access the solutions collection
      const testQuery = query(this.solutionsCollection, limit(1));
      const querySnapshot = await getDocs(testQuery);
      
      console.log('✅ Firebase connection test successful - Method 1');
      return true;
    } catch (error: any) {
      console.error('❌ Firebase connection test failed - Method 1:', error);
      
      try {
        // Method 2: Try to create and delete a test document
        const testCollection = collection(this.firestore, 'connection_tests');
        const testDocRef = doc(testCollection);
        
        await setDoc(testDocRef, {
          test: true,
          timestamp: Timestamp.now(),
          message: 'Connection test'
        });
        
        await deleteDoc(testDocRef);
        
        console.log('✅ Firebase connection test successful - Method 2');
        return true;
      } catch (fallbackError: any) {
        console.error('❌ Firebase connection test failed - Method 2:', fallbackError);
        
        // Check for specific Firebase errors
        if (fallbackError.code) {
          console.error('Firebase error code:', fallbackError.code);
          console.error('Firebase error message:', fallbackError.message);
        }
        
        return false;
      }
    }
  }

  // Get connection status with detailed information
  async getConnectionStatus(): Promise<{ connected: boolean; message: string; error?: any }> {
    try {
      const isConnected = await this.testFirebaseConnection();
      return {
        connected: isConnected,
        message: isConnected ? 'Connected to database' : 'Disconnected from database'
      };
    } catch (error: any) {
      return {
        connected: false,
        message: `Connection error: ${error.message}`,
        error: error
      };
    }
  }

  // The rest of your methods remain the same...
  getSolutionsByCategory(category: string): DeveloperSolution[] {
    return this.solutionsSubject.value.filter(solution => 
      solution.category.toLowerCase() === category.toLowerCase() && solution.published
    );
  }

  getSolutionsByCategory$(category: string): Observable<DeveloperSolution[]> {
    const q = query(
      this.solutionsCollection,
      where('category', '==', category),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<DeveloperSolution[]>;
  }

  getFeaturedSolutions(): DeveloperSolution[] {
    return this.solutionsSubject.value.filter(solution => 
      solution.featured && solution.published
    ).slice(0, 6);
  }

  getRecentSolutions(limit: number = 6): DeveloperSolution[] {
    return this.solutionsSubject.value
      .filter(solution => solution.published)
      .slice(0, limit);
  }

  getSolutionsCount() {
    const solutions = this.solutionsSubject.value;
    return {
      total: solutions.length,
      published: solutions.filter(s => s.published).length,
      draft: solutions.filter(s => !s.published).length,
      featured: solutions.filter(s => s.featured).length
    };
  }

  searchSolutions(searchTerm: string): DeveloperSolution[] {
    const term = searchTerm.toLowerCase();
    return this.solutionsSubject.value.filter(solution =>
      solution.title.toLowerCase().includes(term) ||
      solution.description.toLowerCase().includes(term) ||
      solution.tags.some(tag => tag.toLowerCase().includes(term)) ||
      solution.category.toLowerCase().includes(term)
    );
  }

  getPublishedSolutions(): DeveloperSolution[] {
    return this.solutionsSubject.value.filter(solution => solution.published);
  }

  getDraftSolutions(): DeveloperSolution[] {
    return this.solutionsSubject.value.filter(solution => !solution.published);
  }

  async incrementViews(id: string): Promise<void> {
    try {
      const solution = await this.getSolution(id);
      if (solution) {
        const docRef = doc(this.firestore, 'developer-solutions', id);
        await updateDoc(docRef, { 
          views: (solution.views || 0) + 1,
          updatedAt: Timestamp.now()
        });
        await this.loadAllSolutions();
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async toggleLike(id: string): Promise<void> {
    try {
      const solution = await this.getSolution(id);
      if (solution) {
        const docRef = doc(this.firestore, 'developer-solutions', id);
        await updateDoc(docRef, { 
          likes: (solution.likes || 0) + 1,
          updatedAt: Timestamp.now()
        });
        await this.loadAllSolutions();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }
}