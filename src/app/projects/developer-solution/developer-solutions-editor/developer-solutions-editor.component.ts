import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Timestamp } from '@angular/fire/firestore';
import { DeveloperSolutionsService, DeveloperSolution } from '../../../services/developer-solutions.service';

@Component({
  selector: 'app-developer-solutions-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CKEditorModule],
  templateUrl: './developer-solutions-editor.component.html',
  styleUrls: ['./developer-solutions-editor.component.scss']
})
export class DeveloperSolutionsEditorComponent implements OnInit {
  // CKEditor configuration
  public Editor = ClassicEditor;
  public editorConfig = {
    toolbar: {
      items: [
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'link', 'bulletedList', 'numberedList', '|',
        'outdent', 'indent', '|',
        'blockQuote', 'insertTable', '|',
        'codeBlock', '|',
        'undo', 'redo'
      ],
      shouldNotGroupWhenFull: true
    },
    placeholder: 'Write your solution here. Use the toolbar to format text, add code blocks, lists, and more.',
    codeBlock: {
      languages: [
        { language: 'plaintext', label: 'Plain text' },
        { language: 'javascript', label: 'JavaScript' },
        { language: 'typescript', label: 'TypeScript' },
        { language: 'java', label: 'Java' },
        { language: 'html', label: 'HTML' },
        { language: 'css', label: 'CSS' },
        { language: 'scss', label: 'SCSS' },
        { language: 'sql', label: 'SQL' },
        { language: 'json', label: 'JSON' },
        { language: 'xml', label: 'XML' }
      ]
    }
  };

  solution: DeveloperSolution = {
    title: '',
    description: '',
    content: '',
    category: 'git',
    tags: [],
    difficulty: 'beginner',
    readTime: 5,
    published: true,
    featured: false,
    author: 'Admin',
    views: 0,
    likes: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  isEditMode = false;
  solutionId: string | null = null;
  newTag = '';
  isLoading = false;
  isSaving = false;

  categories = [
    { value: 'git', label: 'Git & Version Control', icon: 'fab fa-git-alt' },
    { value: 'angular', label: 'Angular', icon: 'fab fa-angular' },
    { value: 'typescript', label: 'TypeScript', icon: 'fas fa-code' },
    { value: 'javascript', label: 'JavaScript', icon: 'fab fa-js-square' },
    { value: 'html-css', label: 'HTML & CSS', icon: 'fab fa-html5' },
    { value: 'spring-boot', label: 'Spring Boot', icon: 'fas fa-leaf' },
    { value: 'java', label: 'Java', icon: 'fab fa-java' },
    { value: 'database', label: 'Database', icon: 'fas fa-database' },
    { value: 'devops', label: 'DevOps', icon: 'fas fa-cloud' },
    { value: 'general', label: 'General Programming', icon: 'fas fa-cogs' }
  ];

  difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'success', description: 'Easy to follow for newcomers' },
    { value: 'intermediate', label: 'Intermediate', color: 'warning', description: 'Requires some programming knowledge' },
    { value: 'advanced', label: 'Advanced', color: 'danger', description: 'For experienced developers' }
  ];

  constructor(
    private solutionsService: DeveloperSolutionsService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  // CKEditor ready callback
  onEditorReady(editor: any) {
    console.log('CKEditor is ready to use!', editor);
  }

  // CKEditor change callback
  onContentChange({ editor }: any) {
    this.solution.content = editor.getData();
    this.calculateReadTime();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.solutionId = params['id'];
        if (this.solutionId) {
          this.loadSolution(this.solutionId);
        }
      }
    });
  }

  async loadSolution(id: string) {
    this.isLoading = true;
    try {
      const solution = await this.solutionsService.getSolution(id);
      if (solution) {
        this.solution = { 
          ...this.solution,
          ...solution,
          tags: solution.tags || [],
          readTime: solution.readTime || 5,
          published: solution.published !== undefined ? solution.published : true,
          featured: solution.featured !== undefined ? solution.featured : false,
          author: solution.author || 'Admin'
        };
        this.solutionId = id;
      } else {
        this.toastr.error('Solution not found');
        this.router.navigate(['/admin/developer-solutions']);
      }
    } catch (error) {
      this.toastr.error('Failed to load solution');
      console.error('Error loading solution:', error);
    } finally {
      this.isLoading = false;
    }
  }

  addTag() {
    if (this.newTag.trim() && !this.solution.tags.includes(this.newTag.trim())) {
      this.solution.tags = [...this.solution.tags, this.newTag.trim()];
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.solution.tags = this.solution.tags.filter(t => t !== tag);
  }

  calculateReadTime() {
    const textContent = this.solution.content?.replace(/<[^>]*>/g, '') || '';
    const words = textContent.split(/\s+/).length;
    const codeBlocks = (this.solution.content?.match(/<pre class="ql-syntax"/g) || []).length;
    this.solution.readTime = Math.max(1, Math.ceil((words / 200) + (codeBlocks * 2)));
  }

  getContentWordCount(): number {
    const textContent = this.solution.content?.replace(/<[^>]*>/g, '') || '';
    return textContent.split(/\s+/).length;
  }

  async saveSolution() {
    if (!this.solution.title?.trim() || !this.solution.description?.trim() || !this.solution.content?.trim()) {
      this.toastr.error('Please fill in all required fields (Title, Description, Content)');
      return;
    }

    this.isSaving = true;
    try {
      const solutionData = {
        title: this.solution.title.trim(),
        description: this.solution.description.trim(),
        content: this.solution.content,
        category: this.solution.category,
        tags: this.solution.tags,
        difficulty: this.solution.difficulty,
        readTime: this.solution.readTime,
        published: this.solution.published,
        featured: this.solution.featured,
        author: this.solution.author
      };

      if (this.isEditMode && this.solutionId) {
        await this.solutionsService.updateSolution(this.solutionId, solutionData);
        this.toastr.success('Solution updated successfully!');
      } else {
        await this.solutionsService.createSolution(solutionData);
        this.toastr.success('Solution created successfully!');
      }
      
      this.router.navigate(['/admin/developer-solutions']);
    } catch (error) {
      console.error('Error saving solution:', error);
      this.toastr.error('Failed to save solution');
    } finally {
      this.isSaving = false;
    }
  }

  cancel() {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/admin/developer-solutions']);
    }
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.icon || 'fas fa-code';
  }

  getDifficultyColor(difficulty: string): string {
    const diff = this.difficulties.find(d => d.value === difficulty);
    return diff?.color || 'secondary';
  }

  getDifficultyDescription(difficulty: string): string {
    const diff = this.difficulties.find(d => d.value === difficulty);
    return diff?.description || 'Programming solution';
  }

  getSolutionTags(): string[] {
    return this.solution.tags || [];
  }

  hasSolutionTags(): boolean {
    return !!(this.solution.tags && this.solution.tags.length > 0);
  }

  getSolutionReadTime(): number {
    return this.solution.readTime || 5;
  }

  getSolutionTagsCount(): number {
    return this.solution.tags?.length || 0;
  }
}