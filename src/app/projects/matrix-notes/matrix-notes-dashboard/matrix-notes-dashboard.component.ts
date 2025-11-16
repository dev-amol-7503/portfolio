import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { Tutorial } from '../../../interfaces/tutorial.model';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-matrix-notes-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './matrix-notes-dashboard.component.html',
  styleUrls: ['./matrix-notes-dashboard.component.scss']
})
export class MatrixNotesDashboardComponent implements OnInit {
  tutorials: Tutorial[] = [];
  filteredTutorials: Tutorial[] = [];
  publishedTutorials: Tutorial[] = [];
  draftTutorials: Tutorial[] = [];
  isLoading = true;
  isConnected = false;
  connectionStatus = 'checking'; // 'checking', 'connected', 'disconnected'

  // Filter properties
  searchTerm = '';
  selectedCategory = 'all';
  selectedStatus = 'all';

  // Stats object
  stats = {
    total: 0,
    published: 0,
    draft: 0,
    featured: 0
  };

  // Categories for filter
  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'java', label: 'Java' },
    { value: 'spring', label: 'Spring Framework' },
    { value: 'spring-boot', label: 'Spring Boot' },
    { value: 'database', label: 'Database' },
    { value: 'angular', label: 'Angular' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'git', label: 'Git & Version Control' },
    { value: 'html-css', label: 'HTML & CSS' },
    { value: 'devops', label: 'DevOps' },
    { value: 'general', label: 'General Programming' }
  ];

  // Statuses for filter
  statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' }
  ];

  constructor(
    private matrixNotesService: MatrixNotesService,
    public adminService: AdminService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  async ngOnInit() {
    await this.checkDatabaseConnection();
    await this.loadTutorials();
  }

  async checkDatabaseConnection() {
    try {
      this.connectionStatus = 'checking';
      this.isConnected = await this.matrixNotesService.testFirebaseConnection();
      this.connectionStatus = this.isConnected ? 'connected' : 'disconnected';
      
      if (this.isConnected) {
        console.log('✅ Database connection successful');
      } else {
        console.error('❌ Database connection failed');
        this.toastr.error('Cannot connect to database. Please check your connection.');
      }
    } catch (error) {
      console.error('❌ Database connection error:', error);
      this.connectionStatus = 'disconnected';
      this.isConnected = false;
      this.toastr.error('Database connection error. Please try again.');
    }
  }

  async loadTutorials() {
    try {
      this.isLoading = true;

      // If not connected, try to reconnect
      if (!this.isConnected) {
        await this.checkDatabaseConnection();
        if (!this.isConnected) {
          this.toastr.error('Cannot load tutorials - database connection failed');
          return;
        }
      }

      this.tutorials = await this.matrixNotesService.getAllTutorials();
      this.publishedTutorials = this.tutorials.filter(t => t.published);
      this.draftTutorials = this.tutorials.filter(t => !t.published);
      
      // Update stats
      this.updateStats();
      
      this.filteredTutorials = this.tutorials;

      console.log('📊 Loaded tutorials:', this.tutorials.length);
    } catch (error) {
      console.error('Error loading tutorials:', error);
      this.toastr.error('Failed to load tutorials');
      this.connectionStatus = 'disconnected';
      this.isConnected = false;
    } finally {
      this.isLoading = false;
    }
  }

  async retryConnection() {
    await this.checkDatabaseConnection();
    if (this.isConnected) {
      await this.loadTutorials();
    }
  }

  private updateStats() {
    this.stats = {
      total: this.tutorials.length,
      published: this.publishedTutorials.length,
      draft: this.draftTutorials.length,
      featured: this.tutorials.filter(t => t.featured).length
    };
  }

  // Filter methods
  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredTutorials = this.tutorials.filter(tutorial => {
      const matchesSearch = !this.searchTerm || 
        tutorial.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (tutorial.tags && tutorial.tags.some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase())));
      
      const matchesCategory = this.selectedCategory === 'all' || 
        tutorial.category === this.selectedCategory;
      
      const matchesStatus = this.selectedStatus === 'all' ||
        (this.selectedStatus === 'published' && tutorial.published) ||
        (this.selectedStatus === 'draft' && !tutorial.published);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedStatus = 'all';
    this.filteredTutorials = this.tutorials;
  }

  async deleteTutorial(tutorial: Tutorial) {
    if (confirm(`Are you sure you want to delete "${tutorial.title}"? This action cannot be undone.`)) {
      try {
        await this.matrixNotesService.deleteTutorial(tutorial.id);
        this.toastr.success('Tutorial deleted successfully');
        await this.loadTutorials();
      } catch (error) {
        console.error('Error deleting tutorial:', error);
        this.toastr.error('Failed to delete tutorial');
      }
    }
  }

  async togglePublish(tutorial: Tutorial) {
    try {
      if (tutorial.published) {
        await this.matrixNotesService.unpublishTutorial(tutorial.id);
        this.toastr.success('Tutorial unpublished');
      } else {
        await this.matrixNotesService.publishTutorial(tutorial.id);
        this.toastr.success('Tutorial published');
      }
      await this.loadTutorials();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      this.toastr.error('Failed to update tutorial status');
    }
  }

  async toggleFeatured(tutorial: Tutorial) {
    try {
      await this.matrixNotesService.updateTutorial(tutorial.id, {
        featured: !tutorial.featured
      });
      this.toastr.success(`Tutorial ${tutorial.featured ? 'removed from featured' : 'marked as featured'} successfully`);
      await this.loadTutorials();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      this.toastr.error('Failed to update tutorial');
    }
  }

  createNewTutorial() {
    this.router.navigate(['/admin/matrix-notes/editor']);
  }

  editTutorial(tutorialId: string) {
    this.router.navigate(['/admin/matrix-notes/editor', tutorialId]);
  }

  previewTutorial(tutorialId: string) {
    window.open(`/tutorials/${tutorialId}`, '_blank');
  }

  getTotalViews(): number {
    return this.tutorials.reduce((total, tutorial) => total + (tutorial.views || 0), 0);
  }

  getTotalLikes(): number {
    return this.tutorials.reduce((total, tutorial) => total + (tutorial.likes || 0), 0);
  }

  // Database connection status methods
  getConnectionStatusText(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'Database Connected';
      case 'disconnected': return 'Database Disconnected';
      case 'checking': return 'Checking Connection...';
      default: return 'Unknown Status';
    }
  }

  getConnectionStatusClass(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'status-connected';
      case 'disconnected': return 'status-disconnected';
      case 'checking': return 'status-checking';
      default: return 'status-unknown';
    }
  }

  getConnectionIcon(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'fas fa-check-circle';
      case 'disconnected': return 'fas fa-times-circle';
      case 'checking': return 'fas fa-sync-alt fa-spin';
      default: return 'fas fa-question-circle';
    }
  }

  // Utility methods for template
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'java': 'fab fa-java',
      'spring': 'fas fa-leaf',
      'spring-boot': 'fas fa-bolt',
      'database': 'fas fa-database',
      'angular': 'fab fa-angular',
      'typescript': 'fas fa-code',
      'javascript': 'fab fa-js-square',
      'git': 'fab fa-git-alt',
      'html-css': 'fab fa-html5',
      'devops': 'fas fa-cloud',
      'general': 'fas fa-cogs'
    };
    return icons[category] || 'fas fa-code';
  }

  getCategoryLabel(category: string): string {
    const foundCategory = this.categories.find(c => c.value === category);
    return foundCategory ? foundCategory.label : category;
  }

  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getTimeAgo(timestamp: any): string {
    if (!timestamp) return 'Recently';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  getSolutionViews(tutorial: Tutorial): number {
    return tutorial.views || 0;
  }

  getSolutionLikes(tutorial: Tutorial): number {
    return tutorial.likes || 0;
  }

  getSolutionReadTime(tutorial: Tutorial): number {
    return tutorial.readingTime || 5;
  }

  getPublishStatus(tutorial: Tutorial): string {
    return tutorial.published ? 'Published' : 'Draft';
  }

  getPublishStatusClass(tutorial: Tutorial): string {
    return tutorial.published ? 'bg-success' : 'bg-secondary';
  }

  getPublishButtonClass(tutorial: Tutorial): string {
    return tutorial.published ? 'btn-outline-warning' : 'btn-outline-success';
  }

  getPublishButtonTitle(tutorial: Tutorial): string {
    return tutorial.published ? 'Unpublish' : 'Publish';
  }

  getPublishButtonIcon(tutorial: Tutorial): string {
    return tutorial.published ? 'fas fa-eye-slash' : 'fas fa-eye';
  }

  getFeaturedButtonClass(tutorial: Tutorial): string {
    return tutorial.featured ? 'btn-warning' : 'btn-outline-warning';
  }

  getFeaturedButtonTitle(tutorial: Tutorial): string {
    return tutorial.featured ? 'Remove Featured' : 'Mark as Featured';
  }
}