import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { Tutorial } from '../../../interfaces/tutorial.model';

@Component({
  selector: 'app-tutorials-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tutorials-list.component.html',
  styleUrls: ['./tutorials-list.component.scss']
})
export class TutorialsListComponent implements OnInit {
  tutorials: Tutorial[] = [];
  filteredTutorials: Tutorial[] = [];
  isLoading = true;
  searchQuery = '';
  selectedCategory = 'all';
  selectedDifficulty = 'all';
  sortBy = 'newest';

  categories = [
    'all', 'web-development', 'mobile-development', 'devops', 
    'data-science', 'machine-learning', 'cybersecurity', 'general'
  ];

  difficulties = [
    'all', 'beginner', 'intermediate', 'advanced'
  ];

  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'title', label: 'Title A-Z' }
  ];

  // Pre-filtered categories and difficulties for template
  filteredCategories = this.categories.filter(c => c !== 'all');
  filteredDifficulties = this.difficulties.filter(d => d !== 'all');

  constructor(private matrixNotesService: MatrixNotesService) {}

  async ngOnInit() {
    await this.loadTutorials();
  }

  async loadTutorials() {
    try {
      this.isLoading = true;
      this.tutorials = await this.matrixNotesService.getPublishedTutorials();
      this.filterTutorials();
    } catch (error) {
      console.error('Error loading tutorials:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filterTutorials() {
    let filtered = this.tutorials;

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(tutorial => 
        tutorial.title.toLowerCase().includes(query) ||
        tutorial.description.toLowerCase().includes(query) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.category === this.selectedCategory);
    }

    // Difficulty filter
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.difficulty === this.selectedDifficulty);
    }

    // Sort
    switch (this.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    this.filteredTutorials = filtered;
  }

  onSearchChange() {
    this.filterTutorials();
  }

  onCategoryChange() {
    this.filterTutorials();
  }

  onDifficultyChange() {
    this.filterTutorials();
  }

  onSortChange() {
    this.filterTutorials();
  }

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
      'web-development': 'fas fa-code',
      'mobile-development': 'fas fa-mobile-alt',
      'devops': 'fas fa-server',
      'data-science': 'fas fa-chart-bar',
      'machine-learning': 'fas fa-robot',
      'cybersecurity': 'fas fa-shield-alt',
      'general': 'fas fa-book'
    };
    return icons[category] || 'fas fa-book';
  }

  // Add missing methods
  getTotalViews(): number {
    return this.tutorials.reduce((total, tutorial) => total + (tutorial.views || 0), 0);
  }

  getTotalLikes(): number {
    return this.tutorials.reduce((total, tutorial) => total + (tutorial.likes || 0), 0);
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedDifficulty = 'all';
    this.sortBy = 'newest';
    this.filterTutorials();
  }
}