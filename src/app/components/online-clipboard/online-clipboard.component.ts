// components/online-clipboard/online-clipboard.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

interface ClipboardData {
  id: string;
  text: string;
  created_at: string;
  expires_at: string;
  size: number;
  language: string;
}

@Component({
  selector: 'app-online-clipboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './online-clipboard.component.html',
  styleUrls: ['./online-clipboard.component.scss']
})
export class OnlineClipboardComponent implements OnInit, OnDestroy {
  @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('resultArea') resultArea!: ElementRef<HTMLTextAreaElement>;
  
  // Form models
  textToShare: string = '';
  retrievalCode: string = '';
  sharedText: string = '';
  selectedLanguage: string = 'auto';
  
  // UI states
  activeTab: 'share' | 'retrieve' = 'share';
  isLoading: boolean = false;
  generatedCode: string = '';
  isCopied: boolean = false;
  countdown: number = 120;
  countdownInterval: any;
  autoDetectedLanguage: string = 'text';

  // Performance optimization
  private readonly MAX_TEXT_SIZE = 10 * 1024 * 1024; // 10MB

  // Programming languages with better colors
  languages = [
    { value: 'auto', name: 'Auto Detect', icon: 'fas fa-magic', color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.1)' },
    { value: 'javascript', name: 'JavaScript', icon: 'fab fa-js-square', color: '#F7DF1E', bgColor: 'rgba(247, 223, 30, 0.1)' },
    { value: 'typescript', name: 'TypeScript', icon: 'fab fa-js-square', color: '#3178C6', bgColor: 'rgba(49, 120, 198, 0.1)' },
    { value: 'python', name: 'Python', icon: 'fab fa-python', color: '#3776AB', bgColor: 'rgba(55, 118, 171, 0.1)' },
    { value: 'java', name: 'Java', icon: 'fab fa-java', color: '#ED8B00', bgColor: 'rgba(237, 139, 0, 0.1)' },
    { value: 'html', name: 'HTML', icon: 'fab fa-html5', color: '#E34F26', bgColor: 'rgba(227, 79, 38, 0.1)' },
    { value: 'css', name: 'CSS', icon: 'fab fa-css3-alt', color: '#1572B6', bgColor: 'rgba(21, 114, 182, 0.1)' },
    { value: 'cpp', name: 'C++', icon: 'fas fa-code', color: '#00599C', bgColor: 'rgba(0, 89, 156, 0.1)' },
    { value: 'php', name: 'PHP', icon: 'fab fa-php', color: '#777BB4', bgColor: 'rgba(119, 123, 180, 0.1)' },
    { value: 'sql', name: 'SQL', icon: 'fas fa-database', color: '#4479A1', bgColor: 'rgba(68, 121, 161, 0.1)' },
    { value: 'text', name: 'Plain Text', icon: 'fas fa-file-alt', color: '#6C757D', bgColor: 'rgba(108, 117, 125, 0.1)' }
  ];

  private languagePatterns = {
    javascript: /function|const |let |var |=>|console\.log|\(\) =>/,
    typescript: /interface|type |export |import |:\s*[^{]|any\s*[=:]|string\s*[=:]/,
    python: /def |import |from |print\(|:\s*$|__name__/,
    java: /public |class |void |System\.out\.println|@Override/,
    html: /<!DOCTYPE|<html|<head|<body|<\/?[a-z][\s\S]*?>/i,
    css: /{[^}]*}|\.|#|@media|:\s*[^;]+;/,
    cpp: /#include|using namespace|std::|cout<</,
    php: /<\?php|\$|echo |function |->/,
    sql: /SELECT |INSERT |UPDATE |DELETE |FROM |WHERE |JOIN /
  };

  constructor(private toastr: ToastrService) {}

  ngOnInit() {
    this.loadFromLocalStorage();
  }

  ngOnDestroy() {
    this.stopCountdown();
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('onlineClipboardStorage');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          this.cleanupExpiredEntries(parsedData);
        } catch (e) {
          console.error('Failed to load clipboard data:', e);
        }
      }
    }
  }

  private cleanupExpiredEntries(storageData: any[]) {
    const now = new Date();
    const validData = storageData.filter(([code, data]: [string, ClipboardData]) => {
      const expiryDate = new Date(data.expires_at);
      return now <= expiryDate;
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('onlineClipboardStorage', JSON.stringify(validData));
    }
  }

  // Add this missing property
  get isTextTooLong(): boolean {
    return this.textToShare.length > this.MAX_TEXT_SIZE;
  }

  switchTab(tab: 'share' | 'retrieve') {
    this.activeTab = tab;
    this.generatedCode = '';
    this.isCopied = false;
    this.stopCountdown();
  }

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

  formatCode() {
    if (!this.textToShare.trim()) {
      this.toastr.warning('No code to format');
      return;
    }

    const language = this.selectedLanguage === 'auto' ? this.autoDetectedLanguage : this.selectedLanguage;
    
    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          this.formatJavaScript();
          break;
        case 'python':
          this.formatPython();
          break;
        case 'html':
          this.formatHTML();
          break;
        case 'css':
          this.formatCSS();
          break;
        default:
          this.basicFormatting();
          break;
      }
      this.toastr.success(`${this.getLanguageName(language)} code formatted`);
    } catch (error) {
      this.toastr.error('Formatting failed');
    }
  }

  private formatJavaScript() {
    this.textToShare = this.textToShare
      .replace(/\t/g, '  ')
      .replace(/^\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(line => {
        if (line.trim().endsWith('{') || line.trim().endsWith('(')) {
          return '  ' + line;
        }
        return line;
      })
      .join('\n');
  }

  private formatPython() {
    this.textToShare = this.textToShare
      .replace(/\t/g, '    ')
      .replace(/^\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n');
  }

  private formatHTML() {
    this.textToShare = this.textToShare
      .replace(/>\s+</g, '>\n<')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(line => line.trim())
      .join('\n');
  }

  private formatCSS() {
    this.textToShare = this.textToShare
      .replace(/\t/g, '  ')
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/\s*;?\s*}/g, '\n}')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\n{3,}/g, '\n\n');
  }

  private basicFormatting() {
    this.textToShare = this.textToShare
      .replace(/\t/g, '  ')
      .replace(/^\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
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

  async shareText() {
    if (!this.textToShare.trim()) {
      this.toastr.warning('Please enter some code to share');
      return;
    }

    if (this.isTextTooLong) {
      this.toastr.warning(`Code is too large. Maximum size is 10MB (currently ${this.getFileSize()})`);
      return;
    }

    this.isLoading = true;

    try {
      const language = this.selectedLanguage === 'auto' ? 
        this.detectLanguage(this.textToShare) : this.selectedLanguage;
      
      const code = this.generateCode();
      
      const clipboardData: ClipboardData = {
        id: code,
        text: this.textToShare,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        size: this.textToShare.length,
        language: language
      };

      // Save to localStorage
      const existingData = JSON.parse(localStorage.getItem('onlineClipboardStorage') || '[]');
      existingData.push([code, clipboardData]);
      localStorage.setItem('onlineClipboardStorage', JSON.stringify(existingData));

      this.generatedCode = code;
      this.startCountdown();
      
      this.toastr.success('Code shared successfully!');
      
      await this.copyToClipboard(code);
      
    } catch (error) {
      this.toastr.error('Failed to share code');
    } finally {
      this.isLoading = false;
    }
  }

  async retrieveText() {
    if (!this.retrievalCode.trim()) {
      this.toastr.warning('Please enter a retrieval code');
      return;
    }

    const cleanCode = this.retrievalCode.replace(/\D/g, '');
    if (cleanCode.length !== 4) {
      this.toastr.warning('Please enter a valid 4-digit code');
      return;
    }

    this.retrievalCode = cleanCode;
    this.isLoading = true;

    try {
      const existingData = JSON.parse(localStorage.getItem('onlineClipboardStorage') || '[]');
      const foundData = existingData.find(([code, data]: [string, ClipboardData]) => code === this.retrievalCode);
      
      if (!foundData) {
        this.toastr.error('Invalid code or code has expired');
        this.sharedText = '';
        return;
      }

      const clipboardData: ClipboardData = foundData[1];
      const expiryDate = new Date(clipboardData.expires_at);
      
      if (new Date() > expiryDate) {
        this.toastr.error('This code has expired');
        this.sharedText = '';
        return;
      }

      this.sharedText = clipboardData.text;
      this.autoDetectedLanguage = clipboardData.language;
      this.toastr.success('Code retrieved successfully!');
      
    } catch (error) {
      this.toastr.error('Failed to retrieve code');
    } finally {
      this.isLoading = false;
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
      
      this.toastr.success('Code pasted from clipboard!');
    } catch (error) {
      this.toastr.warning('Could not access clipboard');
    }
  }

  clearFields() {
    if (this.activeTab === 'share') {
      this.textToShare = '';
      this.generatedCode = '';
      this.stopCountdown();
    } else {
      this.retrievalCode = '';
      this.sharedText = '';
    }
    this.isCopied = false;
  }

  getLanguageName(lang: string): string {
    const found = this.languages.find(l => l.value === lang);
    return found ? found.name : 'Text';
  }

  getLanguageIcon(lang: string): string {
    const found = this.languages.find(l => l.value === lang);
    return found ? found.icon : 'fas fa-file-code';
  }

  getLanguageColor(lang: string): string {
    const found = this.languages.find(l => l.value === lang);
    return found ? found.color : '#6C757D';
  }

  getLanguageBgColor(lang: string): string {
    const found = this.languages.find(l => l.value === lang);
    return found ? found.bgColor : 'rgba(108, 117, 125, 0.1)';
  }

  get currentLanguage() {
    return this.selectedLanguage === 'auto' ? this.autoDetectedLanguage : this.selectedLanguage;
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
}