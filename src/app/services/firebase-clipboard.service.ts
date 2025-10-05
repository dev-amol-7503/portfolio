// services/firebase-clipboard.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  where,
  getDocs,
  query
} from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';

interface ClipboardData {
  text: string;
  created_at: Timestamp;
  expires_at: Timestamp;
  size: number;
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseClipboardService {
  private firestore = inject(Firestore);
  private toastr = inject(ToastrService);
  private cleanupTimeouts = new Map<string, any>(); // ✅ Change NodeJS.Timeout to any

  // Generate unique code
  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Share method with auto-cleanup
  async shareText(text: string, language: string): Promise<string> {
    try {
      const code = this.generateCode();
      
      const clipboardData: ClipboardData = {
        text: text,
        language: language,
        created_at: Timestamp.now(),
        expires_at: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 1000)),
        size: text.length
      };

      const docRef = doc(this.firestore, 'clipboard', code);
      await setDoc(docRef, clipboardData);
      
      console.log('✅ Document saved with code:', code);
      
      // Automatically delete after 2 minutes
      this.scheduleDeletion(code, 2 * 60 * 1000);
      
      return code;
    } catch (error) {
      console.error('Error sharing text:', error);
      this.toastr.error('Failed to share code');
      throw error;
    }
  }

  // Schedule automatic deletion
  private scheduleDeletion(code: string, delay: number) {
    const timeout = setTimeout(async () => {
      try {
        const docRef = doc(this.firestore, 'clipboard', code);
        await deleteDoc(docRef);
        this.cleanupTimeouts.delete(code);
        console.log(`🕒 Auto-deleted document: ${code}`);
      } catch (error) {
        console.error('Error in auto-deletion:', error);
      }
    }, delay);
    
    this.cleanupTimeouts.set(code, timeout);
  }

  // Improved retrieve with cleanup
  async retrieveText(code: string): Promise<{text: string, language: string} | null> {
    try {
      const docRef = doc(this.firestore, 'clipboard', code);
      const docSnapshot = await getDoc(docRef);

      console.log('📥 Retrieving code:', code);
      console.log('🔍 Document exists:', docSnapshot.exists());

      if (!docSnapshot.exists()) {
        console.log('❌ No document found');
        return null;
      }

      const data = docSnapshot.data() as ClipboardData;
      const expiresAt = data.expires_at.toDate();
      const now = new Date();
      
      console.log('⏰ Expiry check:', { expiresAt, now, isExpired: expiresAt < now });

      // Check if expired
      if (expiresAt < now) {
        console.log('⏰ Document expired, deleting...');
        await deleteDoc(docRef);
        
        // Clear scheduled timeout if exists
        const timeout = this.cleanupTimeouts.get(code);
        if (timeout) {
          clearTimeout(timeout);
          this.cleanupTimeouts.delete(code);
        }
        
        return null;
      }

      console.log('✅ Successfully retrieved');
      return {
        text: data.text,
        language: data.language
      };
    } catch (error) {
      console.error('Error retrieving text:', error);
      this.toastr.error('Failed to retrieve code');
      throw error;
    }
  }

  // Bulk cleanup on app start (Optional - agar indexes ka issue ho toh comment out karo)
  async cleanupAllExpired() {
    try {
      const clipboardRef = collection(this.firestore, 'clipboard');
      const now = Timestamp.now();
      const expiredQuery = query(clipboardRef, where('expires_at', '<=', now));
      const querySnapshot = await getDocs(expiredQuery);

      const deletePromises = querySnapshot.docs.map(docSnapshot => {
        const code = docSnapshot.id;
        // Clear any pending timeouts
        const timeout = this.cleanupTimeouts.get(code);
        if (timeout) {
          clearTimeout(timeout);
          this.cleanupTimeouts.delete(code);
        }
        return deleteDoc(doc(this.firestore, 'clipboard', code));
      });
      
      await Promise.all(deletePromises);
      
      if (deletePromises.length > 0) {
        console.log(`🧹 Cleaned up ${deletePromises.length} expired documents`);
      }
    } catch (error) {
      console.error('Error in bulk cleanup:', error);
    }
  }

  // Constructor - agar bulk cleanup use karna hai toh
  constructor() {
    // Optional: Agar indexes ka issue ho toh yeh line comment out karo
    // this.cleanupAllExpired().catch(error => {
    //   console.error('Initial cleanup error:', error);
    // });
  }

  // Manual cleanup for testing
  async manualCleanup(code: string) {
    try {
      const docRef = doc(this.firestore, 'clipboard', code);
      await deleteDoc(docRef);
      
      // Clear scheduled timeout
      const timeout = this.cleanupTimeouts.get(code);
      if (timeout) {
        clearTimeout(timeout);
        this.cleanupTimeouts.delete(code);
      }
      
      console.log(`🧹 Manually cleaned up: ${code}`);
    } catch (error) {
      console.error('Manual cleanup error:', error);
    }
  }
}