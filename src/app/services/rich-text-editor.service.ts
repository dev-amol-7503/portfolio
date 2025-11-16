// services/rich-text-editor.service.ts
import { Injectable, ElementRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RichTextEditorService {

  constructor() { }

  // Apply formatting commands
  execCommand(command: string, value: string = '') {
    document.execCommand(command, false, value);
  }

  // Insert code block
  insertCodeBlock(editor: ElementRef) {
    const codeBlock = '\n```\n// Your code here\n```\n';
    this.insertTextAtCursor(editor, codeBlock);
  }

  // Insert text at cursor position
  insertTextAtCursor(editor: ElementRef, text: string) {
    const element = editor.nativeElement;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    
    element.value = value.substring(0, start) + text + value.substring(end);
    element.selectionStart = element.selectionEnd = start + text.length;
    element.focus();
    
    // Trigger input event for Angular binding
    element.dispatchEvent(new Event('input'));
  }

  // Handle keyboard shortcuts
  handleKeydown(event: KeyboardEvent, editor: ElementRef) {
    // Ctrl+B for bold
    if (event.ctrlKey && event.key === 'b') {
      event.preventDefault();
      this.execCommand('bold');
    }
    
    // Ctrl+I for italic
    if (event.ctrlKey && event.key === 'i') {
      event.preventDefault();
      this.execCommand('italic');
    }
    
    // Tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      this.insertTextAtCursor(editor, '    '); // 4 spaces
    }
    
    // Ctrl+Enter for code block
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.insertCodeBlock(editor);
    }
  }

  // Format pasted content
  formatPastedContent(content: string): string {
    // Remove extra styling but preserve structure
    return content
      // Preserve line breaks and paragraphs
      .replace(/\n/g, '\n\n')
      // Convert HTML bold/strong to markdown
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      // Convert HTML italic/em to markdown
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      // Convert code tags
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      // Remove other HTML tags but keep content
      .replace(/<[^>]*>/g, '')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Preserve list items
      .replace(/•\s*/g, '- ')
      .replace(/\d+\.\s*/g, (match) => match)
      // Trim and clean
      .trim();
  }

  // Auto-format content on paste
  handlePaste(event: ClipboardEvent, editor: ElementRef) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text/plain') || '';
    const formattedText = this.formatPastedContent(pastedText);
    this.insertTextAtCursor(editor, formattedText);
  }

  // Get current line number
  getCurrentLine(editor: ElementRef): number {
    const element = editor.nativeElement;
    const value = element.value.substring(0, element.selectionStart);
    return value.split('\n').length;
  }

  // Auto-complete markdown
  autoCompleteMarkdown(event: KeyboardEvent, editor: ElementRef) {
    const element = editor.nativeElement;
    const value = element.value;
    const cursorPos = element.selectionStart;
    
    // Get current line
    const lines = value.split('\n');
    let currentLineIndex = 0;
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for newline
      if (charCount >= cursorPos) {
        currentLineIndex = i;
        break;
      }
    }
    
    const currentLine = lines[currentLineIndex];
    
    // Auto-complete numbered lists
    if (event.key === 'Enter' && /^\d+\.\s/.test(currentLine)) {
      event.preventDefault();
      const nextNumber = parseInt(currentLine.match(/^\d+/)?.[0] || '1') + 1;
      this.insertTextAtCursor(editor, `\n${nextNumber}. `);
    }
    
    // Auto-complete bullet lists
    if (event.key === 'Enter' && /^-\s/.test(currentLine)) {
      event.preventDefault();
      this.insertTextAtCursor(editor, '\n- ');
    }
  }
}