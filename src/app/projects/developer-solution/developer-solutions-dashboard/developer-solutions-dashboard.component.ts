// components/developer-solutions-dashboard/developer-solutions-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { DeveloperSolutionsService, DeveloperSolution } from '../../../services/developer-solutions.service';
import { ThemeService, ThemeConfig } from '../../../services/theme.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-developer-solutions-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './developer-solutions-dashboard.component.html',
  styleUrls: ['./developer-solutions-dashboard.component.scss']
})
export class DeveloperSolutionsDashboardComponent implements OnInit, OnDestroy {
  solutions: DeveloperSolution[] = [];
  filteredSolutions: DeveloperSolution[] = [];
  searchTerm = '';
  selectedCategory = 'all';
  selectedStatus = 'all';
  isLoading = true;
  currentTheme!: ThemeConfig;
  isConnected = false;
  connectionStatus: 'checking' | 'connected' | 'disconnected' = 'checking';
  
  private themeSubscription!: Subscription;
  private solutionsSubscription!: Subscription;

  stats = {
    total: 0,
    published: 0,
    draft: 0,
    featured: 0
  };

  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'git', label: 'Git & Version Control' },
    { value: 'angular', label: 'Angular' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'spring-boot', label: 'Spring Boot' },
    { value: 'java', label: 'Java' },
    { value: 'database', label: 'Database' },
    { value: 'devops', label: 'DevOps' },
    { value: 'general', label: 'General Programming' }
  ];

  statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'featured', label: 'Featured' }
  ];

  constructor(
    private solutionsService: DeveloperSolutionsService,
    private themeService: ThemeService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  async ngOnInit() {
    await this.initializeComponent();
    this.subscribeToTheme();
  }

  private async initializeComponent() {
    console.log('🔄 Initializing Developer Solutions Dashboard...');
    
    // Check connection first
    await this.checkDatabaseConnection();
    
    if (this.isConnected) {
      // Only load solutions if connected
      this.loadSolutions();
    } else {
      this.isLoading = false;
      this.toastr.error('Cannot load solutions - No database connection');
    }
  }

  private subscribeToTheme() {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  private loadSolutions() {
    this.solutionsSubscription = this.solutionsService.solutions$.subscribe({
      next: (solutions) => {
        console.log('📥 Solutions loaded:', solutions.length);
        this.solutions = solutions;
        this.stats = this.solutionsService.getSolutionsCount();
        this.filterSolutions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading solutions:', error);
        this.isLoading = false;
        this.toastr.error('Failed to load solutions');
      }
    });
  }

  filterSolutions() {
    this.filteredSolutions = this.solutions.filter(solution => {
      const matchesSearch = !this.searchTerm || 
        solution.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        solution.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (solution.tags && solution.tags.some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase())));
      
      const matchesCategory = this.selectedCategory === 'all' || 
        solution.category === this.selectedCategory;
      
      const matchesStatus = this.selectedStatus === 'all' ||
        (this.selectedStatus === 'published' && solution.published) ||
        (this.selectedStatus === 'draft' && !solution.published) ||
        (this.selectedStatus === 'featured' && solution.featured);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  onSearchChange() {
    this.filterSolutions();
  }

  onCategoryChange() {
    this.filterSolutions();
  }

  onStatusChange() {
    this.filterSolutions();
  }

  createNewSolution() {
    if (!this.isConnected) {
      this.toastr.error('Cannot create solution - No database connection');
      return;
    }
    this.router.navigate(['/admin/developer-solutions/editor']);
  }

  editSolution(solution: DeveloperSolution) {
    if (!this.isConnected) {
      this.toastr.error('Cannot edit solution - No database connection');
      return;
    }
    this.router.navigate(['/admin/developer-solutions/editor', solution.id]);
  }

  async deleteSolution(solution: DeveloperSolution) {
    if (!this.isConnected) {
      this.toastr.error('Cannot delete solution - No database connection');
      return;
    }

    if (confirm(`Are you sure you want to delete "${solution.title}"? This action cannot be undone.`)) {
      try {
        await this.solutionsService.deleteSolution(solution.id!);
        this.toastr.success('Solution deleted successfully');
      } catch (error) {
        this.toastr.error('Failed to delete solution');
      }
    }
  }

  async togglePublish(solution: DeveloperSolution) {
    if (!this.isConnected) {
      this.toastr.error('Cannot update solution - No database connection');
      return;
    }

    try {
      await this.solutionsService.updateSolution(solution.id!, {
        published: !solution.published
      });
      this.toastr.success(`Solution ${solution.published ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      this.toastr.error('Failed to update solution');
    }
  }

  async toggleFeatured(solution: DeveloperSolution) {
    if (!this.isConnected) {
      this.toastr.error('Cannot update solution - No database connection');
      return;
    }

    try {
      await this.solutionsService.updateSolution(solution.id!, {
        featured: !solution.featured
      });
      this.toastr.success(`Solution ${solution.featured ? 'removed from featured' : 'marked as featured'} successfully`);
    } catch (error) {
      this.toastr.error('Failed to update solution');
    }
  }

  // Database connection methods
  async checkDatabaseConnection() {
    try {
      this.connectionStatus = 'checking';
      console.log('🔄 Checking database connection...');
      
      const status = await this.solutionsService.getConnectionStatus();
      this.isConnected = status.connected;
      this.connectionStatus = this.isConnected ? 'connected' : 'disconnected';
      
      if (this.isConnected) {
        console.log('✅ Database connection successful');
        this.toastr.success('Connected to database');
      } else {
        console.error('❌ Database connection failed:', status.message);
        this.toastr.error(`Database connection failed: ${status.message}`);
      }
    } catch (error: any) {
      console.error('❌ Database connection error:', error);
      this.connectionStatus = 'disconnected';
      this.isConnected = false;
      this.toastr.error(`Database connection error: ${error.message}`);
    }
  }

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

  async retryConnection() {
    console.log('🔄 Retrying database connection...');
    await this.checkDatabaseConnection();
    
    if (this.isConnected) {
      // Reload solutions if connection is restored
      this.isLoading = true;
      await this.solutionsService.loadAllSolutions();
      this.toastr.success('Connection restored! Solutions reloaded.');
    }
  }

  // The rest of your helper methods remain the same...
  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'git': 'fab fa-git-alt',
      'angular': 'fab fa-angular',
      'typescript': 'fas fa-code',
      'javascript': 'fab fa-js-square',
      'spring-boot': 'fas fa-leaf',
      'java': 'fab fa-java',
      'database': 'fas fa-database',
      'devops': 'fas fa-cloud',
      'general': 'fas fa-cogs'
    };
    return icons[category] || 'fas fa-code';
  }

  getCategoryLabel(category: string): string {
    const foundCategory = this.categories.find(c => c.value === category);
    return foundCategory ? foundCategory.label : category;
  }

  getTimeAgo(timestamp: any): string {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  getSolutionViews(solution: DeveloperSolution): number {
    return solution.views || 0;
  }

  getSolutionLikes(solution: DeveloperSolution): number {
    return solution.likes || 0;
  }

  getSolutionReadTime(solution: DeveloperSolution): number {
    return solution.readTime || 5;
  }

  getPublishStatus(solution: DeveloperSolution): string {
    return solution.published ? 'Published' : 'Draft';
  }

  getPublishStatusClass(solution: DeveloperSolution): string {
    return solution.published ? 'bg-success' : 'bg-secondary';
  }

  getPublishButtonClass(solution: DeveloperSolution): string {
    return solution.published ? 'btn-outline-warning' : 'btn-outline-success';
  }

  getPublishButtonTitle(solution: DeveloperSolution): string {
    return solution.published ? 'Unpublish' : 'Publish';
  }

  getPublishButtonIcon(solution: DeveloperSolution): string {
    return solution.published ? 'fas fa-eye-slash' : 'fas fa-eye';
  }

  getFeaturedButtonClass(solution: DeveloperSolution): string {
    return solution.featured ? 'btn-warning' : 'btn-outline-warning';
  }

  getFeaturedButtonTitle(solution: DeveloperSolution): string {
    return solution.featured ? 'Remove Featured' : 'Mark as Featured';
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedStatus = 'all';
    this.filterSolutions();
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.solutionsSubscription) {
      this.solutionsSubscription.unsubscribe();
    }
  }
}