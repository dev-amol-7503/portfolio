import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

// Configure marked options without type annotation
marked.setOptions({
  breaks: true,
  gfm: true,
  async: false
});

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): string {
    if (!value) return '';
    
    try {
      // Convert markdown to HTML using marked
      // Use type assertion to handle the return type
      const html = marked(value) as string;
      
      // Sanitize the HTML for security
      const sanitizedHtml = this.sanitizer.sanitize(SecurityContext.HTML, html);
      
      return sanitizedHtml || '';
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return this.escapeHtml(value); // Return escaped HTML if parsing fails
    }
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}