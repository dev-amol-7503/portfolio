// services/firebase-clipboard.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, // ✅ Change from addDoc to setDoc
  getDoc,  // ✅ Change from getDocs to getDoc
  deleteDoc,
  Timestamp
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

  // Generate unique code
  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Share text to Firebase - FIXED VERSION
  async shareText(text: string, language: string): Promise<string> {
    try {
      const code = this.generateCode();
      
      const clipboardData: ClipboardData = {
        text: text,
        language: language,
        created_at: Timestamp.now(),
        expires_at: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 1000)), // 2 minutes
        size: text.length
      };

      console.log('📤 Sharing with code:', code);
      console.log('📄 Data:', clipboardData);

      // ✅ Use setDoc with custom document ID (your code)
      const docRef = doc(this.firestore, 'clipboard', code);
      await setDoc(docRef, clipboardData);
      
      console.log('✅ Document saved with custom ID:', code);
      
      // Cleanup expired documents
      this.cleanupExpiredDocuments();
      
      return code;
    } catch (error) {
      console.error('❌ Error sharing text:', error);
      throw error;
    }
  }

  // Retrieve text from Firebase - FIXED VERSION
  async retrieveText(code: string): Promise<{text: string, language: string} | null> {
    try {
      console.log('📥 Retrieving code:', code);
      
      // ✅ Directly get document by ID (your code)
      const docRef = doc(this.firestore, 'clipboard', code);
      const docSnapshot = await getDoc(docRef);

      console.log('🔍 Document exists:', docSnapshot.exists());

      if (!docSnapshot.exists()) {
        console.log('❌ No document found with ID:', code);
        return null;
      }

      const data = docSnapshot.data() as ClipboardData;
      console.log('📄 Retrieved data:', data);

      // Check if expired
      if (data.expires_at.toDate() < new Date()) {
        console.log('⏰ Document expired, deleting...');
        await deleteDoc(docRef);
        return null;
      }

      console.log('✅ Successfully retrieved');
      return {
        text: data.text,
        language: data.language
      };
    } catch (error) {
      console.error('❌ Error retrieving text:', error);
      throw error;
    }
  }

  // Cleanup expired documents - UPDATED
  private async cleanupExpiredDocuments() {
    try {
      // Note: Bulk cleanup requires query, but for now focus on main functionality
      console.log('🧹 Cleanup process started');
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}