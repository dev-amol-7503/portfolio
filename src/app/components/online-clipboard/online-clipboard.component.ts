// components/online-clipboard/online-clipboard.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FirebaseClipboardService } from '../../services/firebase-clipboard.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

interface ShareOptions {
  encrypt: boolean;
  passwordProtect: boolean;
  selfDestruct: boolean;
}

interface RetrievedContent {
  type: string;
  data: any;
  language?: string;
  files?: any[];
  timestamp: Date;
  size: string;
}

interface SharedItem {
  code: string;
  type: string;
  title: string;
  timestamp: Date;
  size: string;
  expired: boolean;
}

@Component({
  selector: 'app-online-clipboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarkdownPipe],
  templateUrl: './online-clipboard.component.html',
  styleUrls: ['./online-clipboard.component.scss'],
})
export class OnlineClipboardComponent implements OnInit, OnDestroy {
  @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('resultArea') resultArea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('markdownArea') markdownArea!: ElementRef<HTMLTextAreaElement>;

  // Form models
  textToShare: string = '';
  markdownContent: string = '';
  urlToShare: string = '';
  retrievalCode: string = '';
  selectedLanguage: string = 'auto';
  selectedContentType: string = 'text';

  // File handling
  selectedFiles: File[] = [];
  selectedImage: File | null = null;
  selectedImagePreview: string | null = null;

  // UI states
  activeTab: 'share' | 'retrieve' | 'files' = 'share';
  isLoading: boolean = false;
  generatedCode: string = '';
  isCopied: boolean = false;
  countdown: number = 120;
  countdownInterval: any;
  autoDetectedLanguage: string = 'text';

  // Content management
  retrievedContent: RetrievedContent | null = null;
  sharedItems: SharedItem[] = [];
  urlPreview: any = null;

  // Share options
  options: ShareOptions = {
    encrypt: false,
    passwordProtect: false,
    selfDestruct: false,
  };

  // Performance optimization - Updated to 1MB
  private readonly MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  // Services
  private toastr = inject(ToastrService);
  private firebaseClipboard = inject(FirebaseClipboardService);

  // Programming languages with better colors
  languages = [
    {
      value: 'auto',
      name: 'Auto Detect',
      icon: 'fas fa-magic',
      color: '#FF6B6B',
      bgColor: 'rgba(255, 107, 107, 0.1)',
    },
    {
      value: 'javascript',
      name: 'JavaScript',
      icon: 'fab fa-js-square',
      color: '#F7DF1E',
      bgColor: 'rgba(247, 223, 30, 0.1)',
    },
    {
      value: 'typescript',
      name: 'TypeScript',
      icon: 'fab fa-js-square',
      color: '#3178C6',
      bgColor: 'rgba(49, 120, 198, 0.1)',
    },
    {
      value: 'python',
      name: 'Python',
      icon: 'fab fa-python',
      color: '#3776AB',
      bgColor: 'rgba(55, 118, 171, 0.1)',
    },
    {
      value: 'java',
      name: 'Java',
      icon: 'fab fa-java',
      color: '#ED8B00',
      bgColor: 'rgba(237, 139, 0, 0.1)',
    },
    {
      value: 'html',
      name: 'HTML',
      icon: 'fab fa-html5',
      color: '#E34F26',
      bgColor: 'rgba(227, 79, 38, 0.1)',
    },
    {
      value: 'css',
      name: 'CSS',
      icon: 'fab fa-css3-alt',
      color: '#1572B6',
      bgColor: 'rgba(21, 114, 182, 0.1)',
    },
    {
      value: 'cpp',
      name: 'C++',
      icon: 'fas fa-code',
      color: '#00599C',
      bgColor: 'rgba(0, 89, 156, 0.1)',
    },
    {
      value: 'php',
      name: 'PHP',
      icon: 'fab fa-php',
      color: '#777BB4',
      bgColor: 'rgba(119, 123, 180, 0.1)',
    },
    {
      value: 'sql',
      name: 'SQL',
      icon: 'fas fa-database',
      color: '#4479A1',
      bgColor: 'rgba(68, 121, 161, 0.1)',
    },
    {
      value: 'text',
      name: 'Plain Text',
      icon: 'fas fa-file-alt',
      color: '#6C757D',
      bgColor: 'rgba(108, 117, 125, 0.1)',
    },
  ];

  private languagePatterns = {
    javascript: /function|const |let |var |=>|console\.log|\(\) =>/,
    typescript:
      /interface|type |export |import |:\s*[^{]|any\s*[=:]|string\s*[=:]/,
    python: /def |import |from |print\(|:\s*$|__name__/,
    java: /public |class |void |System\.out\.println|@Override/,
    html: /<!DOCTYPE|<html|<head|<body|<\/?[a-z][\s\S]*?>/i,
    css: /{[^}]*}|\.|#|@media|:\s*[^;]+;/,
    cpp: /#include|using namespace|std::|cout<</,
    php: /<\?php|\$|echo |function |->/,
    sql: /SELECT |INSERT |UPDATE |DELETE |FROM |WHERE |JOIN /,
  };

  ngOnInit() {
    this.loadSharedItems();
  }

  ngOnDestroy() {
    this.stopCountdown();
  }

  // Content Type Methods
  onContentTypeChange() {
    this.clearFields();
  }

  getContentTypeIcon(): string {
    switch (this.selectedContentType) {
      case 'text':
        return 'fas fa-file-code';
      case 'file':
        return 'fas fa-file-archive';
      case 'image':
        return 'fas fa-image';
      case 'url':
        return 'fas fa-link';
      case 'markdown':
        return 'fas fa-markdown';
      default:
        return 'fas fa-file';
    }
  }

  getContentTypeColor(): string {
    switch (this.selectedContentType) {
      case 'text':
        return '#6a5af9';
      case 'file':
        return '#f59e0b';
      case 'image':
        return '#10b981';
      case 'url':
        return '#3b82f6';
      case 'markdown':
        return '#ef4444';
      default:
        return '#6C757D';
    }
  }

  getContentTypeName(): string {
    switch (this.selectedContentType) {
      case 'text':
        return 'Text/Code';
      case 'file':
        return 'File';
      case 'image':
        return 'Image';
      case 'url':
        return 'URL';
      case 'markdown':
        return 'Markdown';
      default:
        return 'Content';
    }
  }

  // File Handling Methods
  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.handleFiles(files);
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > this.MAX_FILE_SIZE) {
        this.toastr.error('Image size must be less than 1MB');
        return;
      }
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onImageDrop(event: DragEvent) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    const imageFile = files.find((file) => file.type.startsWith('image/'));
    if (imageFile) {
      if (imageFile.size > this.MAX_FILE_SIZE) {
        this.toastr.error('Image size must be less than 1MB');
        return;
      }
      this.selectedImage = imageFile;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  handleFiles(files: File[]) {
    const validFiles = files.filter((file) => file.size <= this.MAX_FILE_SIZE);
    const oversizedFiles = files.filter((file) => file.size > this.MAX_FILE_SIZE);
    
    this.selectedFiles = [...this.selectedFiles, ...validFiles];

    if (oversizedFiles.length > 0) {
      this.toastr.error(`Some files exceed 1MB limit and were not added`);
    }
  }

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter((f) => f !== file);
  }


  private getFileIconByExtension(extension: string | undefined): string {
    switch (extension) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      case 'zip':
      case 'rar':
        return 'fa-file-archive';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'fa-file-image';
      default:
        return 'fa-file';
    }
  }

  // URL Methods
  validateUrl() {
    if (this.urlToShare) {
      try {
        new URL(this.urlToShare);
        // Simulate URL preview (in real app, you'd fetch metadata)
        this.urlPreview = {
          title: 'Example Website',
          description: 'This is a preview description of the website',
          favicon: 'https://example.com/favicon.ico',
        };
      } catch {
        this.urlPreview = null;
      }
    } else {
      this.urlPreview = null;
    }
  }

  // Markdown Methods
  insertMarkdown(before: string, after: string) {
    if (!this.markdownArea?.nativeElement) return;

    const textarea = this.markdownArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.markdownContent.substring(start, end);

    this.markdownContent =
      this.markdownContent.substring(0, start) +
      before +
      selectedText +
      after +
      this.markdownContent.substring(end);

    textarea.focus();
    textarea.setSelectionRange(start + before.length, end + before.length);
  }

  // Share Content Method
  canShare(): boolean {
    switch (this.selectedContentType) {
      case 'text':
        return !!this.textToShare.trim() && !this.isTextTooLong;
      case 'file':
        return this.selectedFiles.length > 0;
      case 'image':
        return !!this.selectedImage;
      case 'url':
        return !!this.urlToShare.trim();
      case 'markdown':
        return !!this.markdownContent.trim() && !this.isMarkdownTooLong;
      default:
        return false;
    }
  }

  async shareContent() {
    if (!this.canShare()) {
      if (this.isTextTooLong) {
        this.toastr.error('Text content exceeds 1MB limit');
      } else if (this.isMarkdownTooLong) {
        this.toastr.error('Markdown content exceeds 1MB limit');
      } else {
        this.toastr.warning('Please provide content to share');
      }
      return;
    }

    this.isLoading = true;

    try {
      let contentToShare: any;
      let language = 'text';

      switch (this.selectedContentType) {
        case 'text':
          contentToShare = this.textToShare;
          language =
            this.selectedLanguage === 'auto'
              ? this.detectLanguage(this.textToShare)
              : this.selectedLanguage;
          break;
        case 'file':
          contentToShare = await this.processFiles();
          break;
        case 'image':
          contentToShare = await this.processImage();
          break;
        case 'url':
          contentToShare = this.urlToShare;
          break;
        case 'markdown':
          contentToShare = this.markdownContent;
          language = 'markdown';
          break;
      }

      const code = await this.firebaseClipboard.shareContent(
        contentToShare,
        this.selectedContentType,
        language,
        this.options
      );

      this.generatedCode = code;
      this.startCountdown();
      this.saveSharedItem(code);

      this.toastr.success('Content shared successfully!');
      await this.copyToClipboard(code);
    } catch (error) {
      console.error('Share error:', error);
      this.toastr.error('Failed to share content');
    } finally {
      this.isLoading = false;
    }
  }

  private async processFiles(): Promise<any> {
    const filesData = [];
    for (const file of this.selectedFiles) {
      const dataUrl = await this.fileToDataURL(file);
      filesData.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: dataUrl,
      });
    }
    return filesData;
  }

  private async processImage(): Promise<string> {
    if (!this.selectedImage) throw new Error('No image selected');

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(this.selectedImage!);
    });
  }

  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  // Retrieve Content Method
  async retrieveContent() {
    if (!this.retrievalCode.trim()) {
      this.toastr.warning('Please enter a retrieval code');
      return;
    }

    const cleanCode = this.retrievalCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      this.toastr.warning('Please enter a valid 6-digit code');
      return;
    }

    this.retrievalCode = cleanCode;
    this.isLoading = true;

    try {
      const result = await this.firebaseClipboard.retrieveContent(
        this.retrievalCode
      );

      if (!result) {
        this.toastr.error('Invalid code or content has expired');
        this.retrievedContent = null;
        return;
      }

      this.retrievedContent = {
        type: result.type,
        data: result.data,
        language: result.language,
        files: result.files,
        timestamp: new Date(),
        size: this.formatContentSize(result),
      };

      this.toastr.success('Content retrieved successfully!');
    } catch (error) {
      console.error('Retrieve error:', error);
      this.toastr.error('Failed to retrieve content');
    } finally {
      this.isLoading = false;
    }
  }

  // File Management Methods
  private loadSharedItems() {
    // Load from localStorage or Firebase
    const stored = localStorage.getItem('sharedItems');
    if (stored) {
      this.sharedItems = JSON.parse(stored);
    }
  }

  private saveSharedItem(code: string) {
    const item: SharedItem = {
      code,
      type: this.selectedContentType,
      title: this.getContentTitle(),
      timestamp: new Date(),
      size: this.getContentSize(),
      expired: false,
    };

    this.sharedItems.unshift(item);
    localStorage.setItem('sharedItems', JSON.stringify(this.sharedItems));
  }

  private getContentTitle(): string {
    switch (this.selectedContentType) {
      case 'text':
        return (
          this.textToShare.substring(0, 50) +
          (this.textToShare.length > 50 ? '...' : '')
        );
      case 'file':
        return `${this.selectedFiles.length} files`;
      case 'image':
        return this.selectedImage?.name || 'Image';
      case 'url':
        return this.urlToShare;
      case 'markdown':
        return (
          this.markdownContent.substring(0, 50) +
          (this.markdownContent.length > 50 ? '...' : '')
        );
      default:
        return 'Shared Content';
    }
  }

  getActiveItems(): SharedItem[] {
    return this.sharedItems.filter((item) => !item.expired);
  }

  getExpiredItems(): SharedItem[] {
    return this.sharedItems.filter((item) => item.expired);
  }

  copyItemCode(code: string) {
    this.copyToClipboard(code);
  }

  deleteItem(code: string) {
    this.sharedItems = this.sharedItems.filter((item) => item.code !== code);
    localStorage.setItem('sharedItems', JSON.stringify(this.sharedItems));
    this.toastr.success('Item deleted');
  }

  refreshFiles() {
    this.loadSharedItems();
    this.toastr.info('Files list refreshed');
  }



  downloadImage(dataUrl: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'image.png';
    link.click();
  }

  // Utility Methods
  private formatContentSize(result: any): string {
    if (result.type === 'file' && result.files) {
      const totalSize = result.files.reduce(
        (sum: number, file: any) => sum + (file.size || 0),
        0
      );
      return this.formatFileSize(totalSize);
    }
    return this.getContentSize();
  }

  clearFormatting() {
    if (this.selectedContentType === 'text') {
      this.textToShare = this.textToShare.replace(/\s+/g, ' ').trim();
      this.toastr.success('Formatting cleared');
    }
  }

  copyShareLink() {
    const link = `${window.location.origin}/retrieve/${this.generatedCode}`;
    this.copyToClipboard(link);
  }

  downloadAsFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Language detection and existing methods
  detectLanguage(text: string): string {
    if (!text.trim()) return 'text';

    const lines = text.split('\n').slice(0, 10);
    const sample = lines.join('\n');

    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern.test(sample)) {
        return lang;
      }
    }

    return 'text';
  }

  onTextChange() {
    if (this.selectedLanguage === 'auto' && this.textToShare.length > 10) {
      this.autoDetectedLanguage = this.detectLanguage(this.textToShare);
    }
    this.autoResize();
  }

  private startCountdown() {
    this.countdown = 120;
    this.stopCountdown();
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.stopCountdown();
        this.generatedCode = '';
        this.toastr.info('Share code has expired');
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  async copyToClipboard(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      this.isCopied = true;
      this.toastr.success('Copied to clipboard!');

      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    } catch (error) {
      this.toastr.error('Failed to copy to clipboard');
    }
  }

  onDoubleClick(event: any) {
    event.target.select();
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      this.textToShare = text;

      if (this.selectedLanguage === 'auto') {
        this.autoDetectedLanguage = this.detectLanguage(text);
      }

      this.toastr.success('Content pasted from clipboard!');
    } catch (error) {
      this.toastr.warning('Could not access clipboard');
    }
  }

  clearFields() {
    this.textToShare = '';
    this.markdownContent = '';
    this.urlToShare = '';
    this.selectedFiles = [];
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.generatedCode = '';
    this.stopCountdown();
    this.isCopied = false;
    this.retrievedContent = null;
  }

  switchTab(tab: 'share' | 'retrieve' | 'files') {
    this.activeTab = tab;
    this.generatedCode = '';
    this.isCopied = false;
    this.stopCountdown();
  }

  getLanguageName(lang: string): string {
    const found = this.languages.find((l) => l.value === lang);
    return found ? found.name : 'Text';
  }

  getLanguageIcon(lang: string): string {
    const found = this.languages.find((l) => l.value === lang);
    return found ? found.icon : 'fas fa-file-code';
  }

  getLanguageColor(lang: string): string {
    const found = this.languages.find((l) => l.value === lang);
    return found ? found.color : '#6C757D';
  }

  get currentLanguage() {
    return this.selectedLanguage === 'auto'
      ? this.autoDetectedLanguage
      : this.selectedLanguage;
  }

  get characterCount(): number {
    return this.textToShare.length;
  }

  get lineCount(): number {
    return this.textToShare.split('\n').length;
  }

  getFileSize(): string {
    const bytes = new Blob([this.textToShare]).size;
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  getContentSize(): string {
    switch (this.selectedContentType) {
      case 'text':
        return this.getFileSize();
      case 'file':
        const totalSize = this.selectedFiles.reduce(
          (sum, file) => sum + file.size,
          0
        );
        return this.formatFileSize(totalSize);
      case 'image':
        return this.selectedImage
          ? this.formatFileSize(this.selectedImage.size)
          : '0 B';
      case 'url':
        return 'URL';
      case 'markdown':
        return this.formatFileSize(new Blob([this.markdownContent]).size);
      default:
        return '0 B';
    }
  }

  get isTextTooLong(): boolean {
    return new Blob([this.textToShare]).size > this.MAX_FILE_SIZE;
  }

  get isMarkdownTooLong(): boolean {
    return new Blob([this.markdownContent]).size > this.MAX_FILE_SIZE;
  }

  autoResize() {
    if (this.textArea?.nativeElement) {
      const textarea = this.textArea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
    }
  }

  autoResizeResult() {
    if (this.resultArea?.nativeElement) {
      const textarea = this.resultArea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getContentTypeIconForItem(type: string): string {
    switch (type) {
      case 'text':
        return 'fa-file-code';
      case 'file':
        return 'fa-file-archive';
      case 'image':
        return 'fa-image';
      case 'url':
        return 'fa-link';
      case 'markdown':
        return 'fa-markdown';
      default:
        return 'fa-file';
    }
  }

isDownloading(file: any): boolean {
  // Implement download progress tracking
  return false;
}

getDownloadProgress(file: any): number {
  // Implement progress calculation
  return 0;
}


/**
   * Clear retrieval data and reset the retrieval form
   */
  clearRetrieval(): void {
    this.retrievalCode = '';
    this.retrievedContent = null;
    this.isLoading = false;
    
    // Optional: Reset any form controls if you're using reactive forms
    // this.retrieveForm.reset();
  }

  /**
   * Handle image loading errors
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    
    // Set a placeholder image or hide the broken image
    imgElement.src = 'assets/placeholder-image.png';
    
    // Optional: You can also hide the image entirely
    // imgElement.style.display = 'none';
    
    console.warn('Failed to load retrieved image');
  }

  /**
   * Clear retrieved content and reset the view
   */
  clearRetrievedContent(): void {
    this.retrievedContent = null;
    this.retrievalCode = '';
  }

  /**
   * Get total file size for display
   */
  getTotalFileSize(): string {
    if (!this.retrievedContent?.files?.length) {
      return '0 KB';
    }

    const totalBytes = this.retrievedContent.files.reduce((total: number, file: any) => {
      return total + (file.size || 0);
    }, 0);

    return this.formatFileSize(totalBytes);
  }

  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type class for styling
   */
  getFileTypeClass(file: any): string {
    if (!file?.name) return 'default';
    
    const extension = this.getFileExtension(file.name).toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return 'image';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return 'document';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    }
    
    return 'default';
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(file: any): string {
    if (!file?.name) return 'fa-file';
    
    const extension = this.getFileExtension(file.name).toLowerCase();
    
    const iconMap: { [key: string]: string } = {
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'gif': 'fa-file-image',
      'bmp': 'fa-file-image',
      'svg': 'fa-file-image',
      'webp': 'fa-file-image',
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'txt': 'fa-file-alt',
      'rtf': 'fa-file-alt',
      'zip': 'fa-file-archive',
      'rar': 'fa-file-archive',
      '7z': 'fa-file-archive',
      'tar': 'fa-file-archive',
      'gz': 'fa-file-archive'
    };
    
    return iconMap[extension] || 'fa-file';
  }

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    if (!filename) return '???';
    
    return filename.split('.').pop()?.toUpperCase() || '???';
  }

  /**
   * Get file type for display
   */
  getFileType(filename: string): string {
    if (!filename) return 'Unknown';
    
    const extension = this.getFileExtension(filename).toLowerCase();
    const typeMap: { [key: string]: string } = {
      'jpg': 'JPEG Image',
      'jpeg': 'JPEG Image',
      'png': 'PNG Image',
      'gif': 'GIF Image',
      'bmp': 'Bitmap Image',
      'svg': 'SVG Image',
      'webp': 'WebP Image',
      'pdf': 'PDF Document',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'txt': 'Text File',
      'rtf': 'Rich Text',
      'zip': 'ZIP Archive',
      'rar': 'RAR Archive',
      '7z': '7-Zip Archive',
      'tar': 'TAR Archive',
      'gz': 'GZIP Archive'
    };
    
    return typeMap[extension] || `${extension.toUpperCase()} File`;
  }

  /**
   * Check if file is previewable
   */
  isPreviewable(file: any): boolean {
    if (!file?.name) return false;
    
    const extension = this.getFileExtension(file.name).toLowerCase();
    const previewableTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'pdf', 'txt'];
    
    return previewableTypes.includes(extension);
  }

  /**
   * Download a single file
   */
  downloadFile(file: any): void {
    if (!file?.url) {
      console.error('File URL not available');
      return;
    }

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name || 'download';
    link.target = '_blank';
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download all files
   */
  downloadAllFiles(): void {
    if (!this.retrievedContent?.files?.length) {
      console.warn('No files available to download');
      return;
    }

    // Download each file individually
    this.retrievedContent.files.forEach((file: any) => {
      this.downloadFile(file);
    });
  }

  /**
   * Preview file (for supported types)
   */
  previewFile(file: any): void {
    if (!file?.url) {
      console.error('File URL not available for preview');
      return;
    }

    // For images and PDFs, open in new tab
    const extension = this.getFileExtension(file.name).toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'pdf'].includes(extension)) {
      window.open(file.url, '_blank');
    } else if (extension === 'txt') {
      // For text files, you might want to fetch and display the content
      this.previewTextFile(file.url);
    } else {
      // For unsupported types, download instead
      this.downloadFile(file);
    }
  }

  /**
   * Preview text file content
   */
  private previewTextFile(url: string): void {
    // Fetch and display text file content
    fetch(url)
      .then(response => response.text())
      .then(text => {
        // You could show this in a modal or separate view
        console.log('Text file content:', text);
        // For now, just open in new tab as plain text
        const blob = new Blob([text], { type: 'text/plain' });
        const textUrl = URL.createObjectURL(blob);
        window.open(textUrl, '_blank');
      })
      .catch(error => {
        console.error('Error loading text file:', error);
      });
  }

  /**
   * Copy all file links to clipboard
   */
  copyAllFileLinks(): void {
    if (!this.retrievedContent?.files?.length) {
      console.warn('No files available to copy links');
      return;
    }

    const links = this.retrievedContent.files
      .map((file: any) => file.url)
      .filter((url: string) => url)
      .join('\n');

    if (links) {
      this.copyToClipboard(links);
      // Optional: Show success message
      // this.showToast('File links copied to clipboard!');
    }
  }

  /**
   * Open URL in new tab
   */
  openUrl(url: string): void {
    if (!url) {
      console.warn('No URL provided');
      return;
    }

    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    window.open(fullUrl, '_blank');
  }
}