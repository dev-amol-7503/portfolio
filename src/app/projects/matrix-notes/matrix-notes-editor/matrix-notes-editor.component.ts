import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { Tutorial, TutorialContent } from '../../../interfaces/tutorial.model';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-matrix-notes-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag],
  templateUrl: './matrix-notes-editor.component.html',
  styleUrls: ['./matrix-notes-editor.component.scss'],
})
export class MatrixNotesEditorComponent implements OnInit, OnDestroy {
  @ViewChild('contentEditable') contentEditable!: ElementRef;

  tutorial: Tutorial = this.getEmptyTutorial();
  isEditMode = false;
  isSaving = false;
  autoSaveInterval: any;
  previewMode = false;
  activeContentType: string = 'text';
  currentTextBlockIndex: number = -1;

  currentTextAreaIndex: number = -1;
  textAreaElements: { [key: number]: ElementRef } = {};

  // Available content types
  contentTypes = [
    { value: 'text', label: 'Text', icon: 'fas fa-paragraph' },
    { value: 'code', label: 'Code', icon: 'fas fa-code' },
    { value: 'image', label: 'Image', icon: 'fas fa-image' },
    { value: 'video', label: 'Video', icon: 'fas fa-video' },
    { value: 'diagram', label: 'Diagram', icon: 'fas fa-project-diagram' },
    { value: 'callout', label: 'Callout', icon: 'fas fa-quote-left' },
    { value: 'table', label: 'Table', icon: 'fas fa-table' },
  ];

  programmingLanguages = [
    'html',
    'css',
    'scss',
    'typescript',
    'javascript',
    'java',
    'spring',
    'springboot',
    'hibernate',
    'jpa',
    'restapi',
    'microservices',
  ];

  constructor(
    private matrixNotesService: MatrixNotesService,
    public adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.adminService.isAdmin$.subscribe((isAdmin) => {
      if (!isAdmin) {
        this.router.navigate(['/admin/login']);
        return;
      }
    });

    // Check if editing existing tutorial
    const tutorialId = this.route.snapshot.paramMap.get('id');
    if (tutorialId) {
      this.loadTutorial(tutorialId);
    }

    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      if (this.tutorial.title || this.tutorial.content.length > 0) {
        this.autoSave();
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  private getEmptyTutorial(): Tutorial {
    return {
      id: '',
      title: '',
      description: '',
      content: [],
      tags: [],
      category: 'web-development',
      author: 'admin',
      published: false,
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      readingTime: 5,
      difficulty: 'beginner',
      bookmarks: [],
      views: 0,
      likes: 0,
    };
  }

  async loadTutorial(tutorialId: string) {
    try {
      const tutorial = await this.matrixNotesService.getTutorial(tutorialId);
      if (tutorial) {
        this.tutorial = tutorial;
        this.isEditMode = true;
      }
    } catch (error) {
      this.toastr.error('Failed to load tutorial');
    }
  }

  addContentBlock() {
    const newContent: TutorialContent = {
      id: Date.now().toString(),
      type: this.activeContentType as any,
      content: '',
      order: this.tutorial.content.length,
      language: this.activeContentType === 'code' ? 'javascript' : undefined,
      fileName: this.activeContentType === 'code' ? '' : undefined,
      caption: this.activeContentType === 'image' ? '' : undefined,
      title: this.activeContentType === 'video' ? '' : undefined,
      metadata:
        this.activeContentType === 'callout' ? { type: 'info' } : undefined,
    };

    this.tutorial.content.push(newContent);
  }

  removeContentBlock(index: number) {
    this.tutorial.content.splice(index, 1);
    this.updateContentOrder();
  }

  updateContentOrder() {
    this.tutorial.content.forEach((content, index) => {
      content.order = index;
    });
  }

  dropContent(event: CdkDragDrop<TutorialContent[]>) {
    moveItemInArray(
      this.tutorial.content,
      event.previousIndex,
      event.currentIndex
    );
    this.updateContentOrder();
  }

  addTag(tag: string) {
    if (tag && !this.tutorial.tags.includes(tag)) {
      this.tutorial.tags.push(tag);
    }
  }

  removeTag(index: number) {
    this.tutorial.tags.splice(index, 1);
  }

  async saveDraft() {
    this.isSaving = true;
    try {
      if (this.isEditMode) {
        await this.matrixNotesService.updateTutorial(
          this.tutorial.id,
          this.tutorial
        );
        this.toastr.success('Draft saved successfully');
      } else {
        const tutorialId = await this.matrixNotesService.createTutorial(
          this.tutorial
        );
        this.tutorial.id = tutorialId;
        this.isEditMode = true;
        this.toastr.success('Draft saved successfully');
      }
    } catch (error) {
      this.toastr.error('Failed to save draft');
    } finally {
      this.isSaving = false;
    }
  }

  async autoSave() {
    if (
      this.isEditMode &&
      (this.tutorial.title || this.tutorial.content.length > 0)
    ) {
      try {
        await this.matrixNotesService.updateTutorial(this.tutorial.id, {
          ...this.tutorial,
          updatedAt: new Date(),
        });
        console.log('Auto-saved tutorial');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }

  async publishTutorial() {
    if (!this.tutorial.title) {
      this.toastr.error('Please add a title before publishing');
      return;
    }

    if (this.tutorial.content.length === 0) {
      this.toastr.error('Please add some content before publishing');
      return;
    }

    this.isSaving = true;
    try {
      if (!this.isEditMode) {
        const tutorialId = await this.matrixNotesService.createTutorial(
          this.tutorial
        );
        this.tutorial.id = tutorialId;
        this.isEditMode = true;
      }

      await this.matrixNotesService.publishTutorial(this.tutorial.id);
      this.tutorial.published = true;
      this.toastr.success('Tutorial published successfully');
    } catch (error) {
      this.toastr.error('Failed to publish tutorial');
    } finally {
      this.isSaving = false;
    }
  }

  calculateReadingTime(): number {
    const wordCount = this.tutorial.content
      .filter((content) => content.type === 'text')
      .reduce((count, content) => count + content.content.split(' ').length, 0);

    return Math.max(1, Math.ceil(wordCount / 200));
  }

  getContentIcon(type: string): string {
    const contentType = this.contentTypes.find((ct) => ct.value === type);
    return contentType?.icon || 'fas fa-question';
  }

  // Method to handle image upload
  async onImageUpload(event: any, contentIndex: number) {
    const file = event.target.files[0];
    if (file) {
      // In a real app, you would upload to Firebase Storage
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tutorial.content[contentIndex].content = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Enhanced renderContent method
  renderContent(content: TutorialContent): string {
    switch (content.type) {
      case 'text':
        return `<div class="rich-text-content">${content.content}</div>`;
      case 'code':
        const fileName = content.fileName
          ? `<div class="code-filename">${content.fileName}</div>`
          : '';
        return `
          <div class="code-block-preview">
            ${fileName}
            <pre data-language="${content.language}"><code class="language-${
          content.language
        }">${this.escapeHtml(content.content)}</code></pre>
          </div>
        `;
      case 'image':
        const caption = content.caption
          ? `<div class="image-caption">${content.caption}</div>`
          : '';
        return `
          <div class="image-block-preview">
            <img src="${content.content}" alt="${
          content.caption || 'Tutorial image'
        }" class="img-fluid rounded">
            ${caption}
          </div>
        `;
      case 'video':
        return this.renderVideo(content.content, content.title);
      case 'callout':
        return this.renderCallout(content.content, content.metadata?.type);
      case 'table':
        return this.renderTable(content.content);
      case 'diagram':
        return `<div class="diagram-preview-content">${this.renderMarkdown(
          content.content
        )}</div>`;
      default:
        return content.content;
    }
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private renderVideo(url: string, title?: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeId(url);
      return `
        <div class="video-preview-content">
          ${title ? `<h4>${title}</h4>` : ''}
          <div class="video-container">
            <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
      `;
    }
    return `<p><a href="${url}" target="_blank">${
      title || 'Watch Video'
    }</a></p>`;
  }

  private extractYouTubeId(url: string): string {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : '';
  }

  private renderCallout(content: string, type: string = 'info'): string {
    const icons = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      danger: 'fas fa-exclamation-circle',
      success: 'fas fa-check-circle',
      tip: 'fas fa-lightbulb',
    };

    const icon = icons[type as keyof typeof icons] || icons.info;
    return `
      <div class="callout callout-${type}">
        <div class="callout-icon">
          <i class="${icon}"></i>
        </div>
        <div class="callout-content">
          ${this.renderMarkdown(content)}
        </div>
      </div>
    `;
  }

  private renderTable(content: string): string {
    const rows = content.split('\n').filter((row) => row.trim());
    if (rows.length === 0) return '';

    let html =
      '<div class="table-responsive"><table class="table table-striped">';
    rows.forEach((row, index) => {
      const cells = row.split(',').map((cell) => cell.trim());
      const tag = index === 0 ? 'th' : 'td';
      html += `<tr>${cells
        .map((cell) => `<${tag}>${cell}</${tag}>`)
        .join('')}</tr>`;
    });
    html += '</table></div>';
    return html;
  }

  // Table preview for editor
  renderTablePreview(content: string): string {
    return this.renderTable(content);
  }

  // Add this method to handle metadata updates
  updateCalloutType(content: TutorialContent, type: string) {
    if (!content.metadata) {
      content.metadata = {};
    }
    content.metadata.type = type;
  }

  // Enhanced paste handling for rich text
  onTextPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    this.currentTextBlockIndex = index;

    const text =
      event.clipboardData?.getData('text/html') ||
      event.clipboardData?.getData('text/plain');

    if (text) {
      // Clean and preserve formatting
      const cleanHtml = this.cleanPastedHtml(text);
      document.execCommand('insertHTML', false, cleanHtml);

      // Update content
      const textEditor = event.target as HTMLElement;
      this.tutorial.content[index].content = textEditor.innerHTML;
    }
  }

  private cleanPastedHtml(html: string): string {
    // Remove unwanted tags but preserve basic formatting
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '');

    return cleanHtml;
  }

  // Enhanced text editor methods
  getTextContent(index: number): string {
    const content = this.tutorial.content[index].content;
    return content && content.trim() !== '' ? content : '<p><br></p>';
  }

  onTextEditorBlur() {
    console.log('Text editor blurred');
    // Keep the current index for a short time to allow toolbar interactions
    setTimeout(() => {
      this.currentTextBlockIndex = -1;
    }, 150);
  }

  onTextEditorClick(index: number) {
    console.log('Text editor clicked:', index);
    this.currentTextBlockIndex = index;

    // Ensure the editor gets focus
    const textEditors = document.querySelectorAll('.text-editor');
    if (textEditors[index]) {
      (textEditors[index] as HTMLElement).focus();
    }
  }

  onTextEditorKeydown(index: number, event: KeyboardEvent) {
    this.currentTextBlockIndex = index;
  }

  onTextContentChange(index: number, event: any) {
    const newContent = event.target.innerHTML;
    this.tutorial.content[index].content = newContent;
    console.log('Content updated for block:', index, newContent);
  }

  // Enhanced formatting with better focus management
  formatText(command: string, index: number, event?: any) {
    console.log('Formatting text:', command, 'for block:', index);

    // Store the current index
    this.currentTextBlockIndex = index;

    // Get the specific text editor
    const textEditors = document.querySelectorAll('.text-editor');
    if (textEditors[index]) {
      const textEditor = textEditors[index] as HTMLElement;

      // Focus on the editor first
      textEditor.focus();

      // Small delay to ensure focus is set
      setTimeout(() => {
        this.executeFormatCommand(command, event, textEditor);

        // Update the content model
        this.tutorial.content[index].content = textEditor.innerHTML;
      }, 10);
    }
  }

  private executeFormatCommand(
    command: string,
    event: any,
    textEditor: HTMLElement
  ) {
    try {
      // Ensure we're still focused on the correct editor
      textEditor.focus();

      switch (command) {
        case 'bold':
          document.execCommand('bold', false, undefined);
          break;
        case 'italic':
          document.execCommand('italic', false, undefined);
          break;
        case 'underline':
          document.execCommand('underline', false, undefined);
          break;
        case 'bullet':
          document.execCommand('insertUnorderedList', false, undefined);
          break;
        case 'number':
          document.execCommand('insertOrderedList', false, undefined);
          break;
        case 'heading':
          const heading = event?.target?.value;
          if (heading) {
            document.execCommand('formatBlock', false, `<${heading}>`);
          } else {
            document.execCommand('formatBlock', false, '<p>');
          }
          break;
        case 'fontSize':
          const size = event?.target?.value;
          if (size) {
            document.execCommand('fontSize', false, size);
          }
          break;
        case 'alignLeft':
          document.execCommand('justifyLeft', false, undefined);
          break;
        case 'alignCenter':
          document.execCommand('justifyCenter', false, undefined);
          break;
        case 'alignRight':
          document.execCommand('justifyRight', false, undefined);
          break;
        case 'alignJustify':
          document.execCommand('justifyFull', false, undefined);
          break;
      }
    } catch (error) {
      console.error('Error executing format command:', error);
    }
  }

  public renderMarkdown(text: string): string {
    if (!text) return '';

    let html = text
      // Headers
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // Lists
      .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/^(\d+)\. (.*$)/gim, '<ol><li>$2</li></ol>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    // Fix list formatting
    html = html.replace(/<\/ul><br><ul>/gim, '');
    html = html.replace(/<\/ol><br><ol>/gim, '');

    return html;
  }

  @ViewChild('textArea', { static: false }) set textAreaRef(ref: ElementRef) {
    if (ref && this.currentTextAreaIndex !== -1) {
      this.textAreaElements[this.currentTextAreaIndex] = ref;
    }
  }

  onTextEditorFocus(index: number) {
    this.currentTextAreaIndex = index;
  }

  // Handle keyboard shortcuts and tab key
  handleKeydown(event: KeyboardEvent, index: number) {
    this.currentTextAreaIndex = index;

    // Tab key handling
    if (event.key === 'Tab') {
      event.preventDefault();
      this.handleTabKey(event.shiftKey, index);
      return;
    }

    // Keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          this.insertMarkdown('bold', index);
          break;
        case 'i':
          event.preventDefault();
          this.insertMarkdown('italic', index);
          break;
        case 'k':
          event.preventDefault();
          this.insertMarkdown('link', index);
          break;
      }
    }
  }

  // Handle Tab and Shift+Tab for indentation with proper typing
  handleTabKey(isShift: boolean, index: number) {
    const textarea = this.textAreaElements[index]?.nativeElement;
    if (!textarea) return;

    const start: number = textarea.selectionStart;
    const end: number = textarea.selectionEnd;
    const value: string = textarea.value;

    if (isShift) {
      // Unindent (Shift+Tab)
      const beforeCursor: string = value.substring(0, start);
      const afterCursor: string = value.substring(end);
      const currentLineStart: number = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine: string = value.substring(currentLineStart, start);

      if (currentLine.startsWith('    ') || currentLine.startsWith('\t')) {
        const newValue: string =
          value.substring(0, currentLineStart) +
          currentLine.substring(currentLine.startsWith('    ') ? 4 : 1) +
          afterCursor;

        textarea.value = newValue;
        this.tutorial.content[index].content = newValue;

        const newPos: number = start - (currentLine.startsWith('    ') ? 4 : 1);
        textarea.setSelectionRange(newPos, newPos);
      }
    } else {
      // Indent (Tab)
      const newValue: string =
        value.substring(0, start) + '    ' + value.substring(end);
      textarea.value = newValue;
      this.tutorial.content[index].content = newValue;

      const newPos: number = start + 4;
      textarea.setSelectionRange(newPos, newPos);
    }
  }

  // Insert markdown formatting with proper typing
  insertMarkdown(type: string, index: number) {
    const textarea = this.textAreaElements[index]?.nativeElement;
    if (!textarea) return;

    const start: number = textarea.selectionStart;
    const end: number = textarea.selectionEnd;
    const value: string = textarea.value;
    const selectedText: string = value.substring(start, end);

    let newValue: string = '';
    let newCursorPos: number = start;

    switch (type) {
      case 'bold':
        newValue =
          value.substring(0, start) +
          `**${selectedText}**` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 2);
        break;

      case 'italic':
        newValue =
          value.substring(0, start) +
          `*${selectedText}*` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 1);
        break;

      case 'code':
        newValue =
          value.substring(0, start) +
          `\`${selectedText}\`` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 1);
        break;

      case 'bullet':
        if (selectedText) {
          const bulletedText: string = selectedText
            .split('\n')
            .map((line: string) => (line.trim() ? `- ${line}` : ''))
            .join('\n');
          newValue =
            value.substring(0, start) + bulletedText + value.substring(end);
        } else {
          newValue = value.substring(0, start) + `- ` + value.substring(end);
          newCursorPos = start + 2;
        }
        break;

      case 'number':
        if (selectedText) {
          const numberedText: string = selectedText
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string, idx: number) => `${idx + 1}. ${line}`)
            .join('\n');
          newValue =
            value.substring(0, start) + numberedText + value.substring(end);
        } else {
          newValue = value.substring(0, start) + `1. ` + value.substring(end);
          newCursorPos = start + 3;
        }
        break;

      case 'h1':
        newValue =
          value.substring(0, start) +
          `# ${selectedText || 'Heading 1'}` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 2);
        break;

      case 'h2':
        newValue =
          value.substring(0, start) +
          `## ${selectedText || 'Heading 2'}` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 3);
        break;

      case 'h3':
        newValue =
          value.substring(0, start) +
          `### ${selectedText || 'Heading 3'}` +
          value.substring(end);
        newCursorPos = start + (selectedText ? 0 : 4);
        break;

      case 'quote':
        if (selectedText) {
          const quotedText: string = selectedText
            .split('\n')
            .map((line: string) => `> ${line}`)
            .join('\n');
          newValue =
            value.substring(0, start) + quotedText + value.substring(end);
        } else {
          newValue = value.substring(0, start) + `> ` + value.substring(end);
          newCursorPos = start + 2;
        }
        break;

      case 'link':
        newValue =
          value.substring(0, start) +
          `[${selectedText || 'link text'}](https://)` +
          value.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 3 : 12);
        break;

      case 'image':
        newValue =
          value.substring(0, start) +
          `![${selectedText || 'alt text'}](https://)` +
          value.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 4 : 13);
        break;

      case 'table':
        const table: string = `| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |`;
        newValue = value.substring(0, start) + table + value.substring(end);
        break;

      case 'hr':
        newValue = value.substring(0, start) + `\n---\n` + value.substring(end);
        newCursorPos = start + 5;
        break;

      default:
        console.warn('Unknown markdown type:', type);
        return;
    }

    textarea.value = newValue;
    this.tutorial.content[index].content = newValue;

    // Set cursor position
    setTimeout(() => {
      let newEndPos: number;
      if (selectedText) {
        switch (type) {
          case 'bold':
            newEndPos = newCursorPos + selectedText.length + 4;
            break;
          case 'italic':
            newEndPos = newCursorPos + selectedText.length + 2;
            break;
          default:
            newEndPos = newCursorPos + selectedText.length;
        }
      } else {
        newEndPos = newCursorPos;
      }

      textarea.setSelectionRange(newCursorPos, newEndPos);
      textarea.focus();
    }, 0);
  }

  // Text alignment with proper typing
  alignText(alignment: string, index: number) {
    const textarea = this.textAreaElements[index]?.nativeElement;
    if (!textarea) return;

    const start: number = textarea.selectionStart;
    const end: number = textarea.selectionEnd;
    const value: string = textarea.value;
    const selectedText: string = value.substring(start, end);

    if (selectedText) {
      let alignedText: string = '';

      switch (alignment) {
        case 'center':
          alignedText = `<div style="text-align: center">\n${selectedText}\n</div>`;
          break;
        case 'right':
          alignedText = `<div style="text-align: right">\n${selectedText}\n</div>`;
          break;
        case 'left':
        default:
          alignedText = `<div style="text-align: left">\n${selectedText}\n</div>`;
          break;
      }

      const newValue: string =
        value.substring(0, start) + alignedText + value.substring(end);
      textarea.value = newValue;
      this.tutorial.content[index].content = newValue;
    }
  }

  // Toggle preview with proper typing
  public togglePreview1(index: number) {
    this.previewMode = !this.previewMode;
    if (!this.tutorial.content[index].showPreview) {
      this.tutorial.content[index].showPreview = true;
    } else {
      this.tutorial.content[index].showPreview = false;
    }
  }

  // For individual text block preview - rename this one
toggleTextPreview(index: number) {
  if (!this.tutorial.content[index].showPreview) {
    this.tutorial.content[index].showPreview = true;
  } else {
    this.tutorial.content[index].showPreview = false;
  }
}

// Keep this one for global preview mode
togglePreview() {
  this.previewMode = !this.previewMode;
}

  

  // Enhanced markdown rendering with alignment support
  public renderEnhancedMarkdown(text: string): string {
    if (!text) return '';

    let html: string = text
      // Headers
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/gim, '<code class="inline-code">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Horizontal Rule
      .replace(/^---$/gim, '<hr>')
      // Images
      .replace(
        /!\[(.*?)\]\((.*?)\)/gim,
        '<img src="$2" alt="$1" class="img-fluid">'
      )
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    // Handle alignment divs
    html = html.replace(
      /<div style="text-align: center">(.*?)<\/div>/gim,
      '<div style="text-align: center">$1</div>'
    );
    html = html.replace(
      /<div style="text-align: right">(.*?)<\/div>/gim,
      '<div style="text-align: right">$1</div>'
    );
    html = html.replace(
      /<div style="text-align: left">(.*?)<\/div>/gim,
      '<div style="text-align: left">$1</div>'
    );

    // Clean up multiple line breaks
    html = html.replace(/<br><br>/gim, '<br>');

    return html;
  }
  
}
