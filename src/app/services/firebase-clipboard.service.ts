// services/firebase-clipboard.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp
} from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';

interface ShareOptions {
  encrypt: boolean;
  passwordProtect: boolean;
  selfDestruct: boolean;
}

interface ClipboardData {
  data: any;
  type: string;
  language: string;
  created_at: Timestamp;
  expires_at: Timestamp;
  size: number;
  options: ShareOptions;
  files?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseClipboardService {
  private firestore = inject(Firestore);
  private toastr = inject(ToastrService);
  private cleanupTimeouts = new Map<string, any>();

  // Generate 6-digit code
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Enhanced share method for multiple content types
  async shareContent(data: any, type: string, language: string, options: ShareOptions): Promise<string> {
    try {
      const code = this.generateCode();
      
      const clipboardData: ClipboardData = {
        data: data,
        type: type,
        language: language,
        options: options,
        created_at: Timestamp.now(),
        expires_at: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 1000)), // 2 minutes
        size: this.calculateSize(data, type)
      };

      // Handle file data specifically
      if (type === 'file' && Array.isArray(data)) {
        clipboardData.files = data;
      }

      const docRef = doc(this.firestore, 'clipboard', code);
      await setDoc(docRef, clipboardData);
      
      console.log('✅ Document saved with code:', code, 'Type:', type);
      
      // Automatically delete after 2 minutes
      this.scheduleDeletion(code, 2 * 60 * 1000);
      
      return code;
    } catch (error) {
      console.error('Error sharing content:', error);
      this.toastr.error('Failed to share content');
      throw error;
    }
  }

  // Calculate size based on content type
  private calculateSize(data: any, type: string): number {
    switch (type) {
      case 'text':
      case 'markdown':
        return new Blob([data]).size;
      case 'file':
        return Array.isArray(data) ? data.reduce((sum: number, file: any) => sum + (file.size || 0), 0) : 0;
      case 'image':
      case 'url':
        return new Blob([JSON.stringify(data)]).size;
      default:
        return 0;
    }
  }

  // Schedule automatic deletion after 2 minutes
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

  // Enhanced retrieve method for multiple content types
  async retrieveContent(code: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, 'clipboard', code);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = docSnapshot.data() as ClipboardData;
      const expiresAt = data.expires_at.toDate();
      const now = new Date();

      // Check if expired
      if (expiresAt < now) {
        await deleteDoc(docRef);
        
        // Clear scheduled timeout if exists
        const timeout = this.cleanupTimeouts.get(code);
        if (timeout) {
          clearTimeout(timeout);
          this.cleanupTimeouts.delete(code);
        }
        
        return null;
      }

      // Handle self-destruct option
      if (data.options.selfDestruct) {
        await deleteDoc(docRef);
        const timeout = this.cleanupTimeouts.get(code);
        if (timeout) {
          clearTimeout(timeout);
          this.cleanupTimeouts.delete(code);
        }
      }

      return {
        data: data.data,
        type: data.type,
        language: data.language,
        files: data.files,
        options: data.options
      };
    } catch (error) {
      console.error('Error retrieving content:', error);
      this.toastr.error('Failed to retrieve content');
      throw error;
    }
  }

  // Backward compatibility
  async shareText(text: string, language: string): Promise<string> {
    return this.shareContent(text, 'text', language, {
      encrypt: false,
      passwordProtect: false,
      selfDestruct: false
    });
  }

  async retrieveText(code: string): Promise<{text: string, language: string} | null> {
    const result = await this.retrieveContent(code);
    if (!result) return null;

    return {
      text: result.data,
      language: result.language
    };
  }
}