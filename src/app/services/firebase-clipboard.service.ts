// services/firebase-clipboard.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  addDoc, 
  collection, 
  doc, 
  getDocs,
  query,
  where,
  deleteDoc,
  Timestamp,
  DocumentData 
} from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';

interface ClipboardData {
  id: string;
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

  // Share text to Firebase
  async shareText(text: string, language: string): Promise<string> {
    try {
      const code = this.generateCode();
      
      const clipboardData: ClipboardData = {
        id: code,
        text: text,
        language: language,
        created_at: Timestamp.now(),
        expires_at: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 1000)), // 2 minutes
        size: text.length
      };

      // Save to Firestore
      const docRef = await addDoc(collection(this.firestore, 'clipboard'), clipboardData);
      
      console.log('Document written with ID: ', docRef.id);
      
      // Cleanup expired documents
      this.cleanupExpiredDocuments();
      
      return code;
    } catch (error) {
      console.error('Error sharing text:', error);
      throw error;
    }
  }

  // Retrieve text from Firebase
  // Retrieve text from Firebase - Simple version
async retrieveText(code: string): Promise<{text: string, language: string} | null> {
  try {
    const clipboardRef = collection(this.firestore, 'clipboard');
    const q = query(clipboardRef, where('id', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Take the first matching document
    const docSnapshot = querySnapshot.docs[0];
    const data = docSnapshot.data() as any; // Use 'any' to avoid type issues

    // Check if expired
    if (data.expires_at.toDate() < new Date()) {
      // Delete expired document
      await deleteDoc(doc(this.firestore, 'clipboard', docSnapshot.id));
      return null;
    }

    return {
      text: data.text,
      language: data.language
    };
  } catch (error) {
    console.error('Error retrieving text:', error);
    throw error;
  }
}

  // Type guard function to check if data is ClipboardData
  private isClipboardData(data: any): data is ClipboardData {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.text === 'string' &&
      data.expires_at instanceof Timestamp &&
      data.created_at instanceof Timestamp &&
      typeof data.language === 'string' &&
      typeof data.size === 'number'
    );
  }

  // Alternative simpler approach without type guard
  async retrieveTextAlternative(code: string): Promise<{text: string, language: string} | null> {
    try {
      const clipboardRef = collection(this.firestore, 'clipboard');
      const q = query(clipboardRef, where('id', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // Simple approach - directly use the first document
      const docSnapshot = querySnapshot.docs[0];
      const data = docSnapshot.data();

      // Check if required fields exist
      if (!data || !data['expires_at'] || !data['text'] || !data['language']) {
        return null;
      }

      // Type assertion for expires_at
      const expiresAt = data['expires_at'] as Timestamp;
      
      // Check if expired
      if (expiresAt.toDate() < new Date()) {
        // Delete expired document
        await deleteDoc(doc(this.firestore, 'clipboard', docSnapshot.id));
        return null;
      }

      return {
        text: data['text'] as string,
        language: data['language'] as string
      };
    } catch (error) {
      console.error('Error retrieving text:', error);
      throw error;
    }
  }

  // Cleanup expired documents
  private async cleanupExpiredDocuments() {
    try {
      const clipboardRef = collection(this.firestore, 'clipboard');
      const q = query(clipboardRef, where('expires_at', '<', Timestamp.now()));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(this.firestore, 'clipboard', docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      
      if (deletePromises.length > 0) {
        console.log(`Cleaned up ${deletePromises.length} expired documents`);
      }
    } catch (error) {
      console.error('Error cleaning up expired documents:', error);
    }
  }
}