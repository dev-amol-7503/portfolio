import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { Tutorial } from '../../../interfaces/tutorial.model';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-matrix-notes-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './matrix-notes-dashboard.component.html',
  styleUrls: ['./matrix-notes-dashboard.component.scss']
})
export class MatrixNotesDashboardComponent implements OnInit {
  tutorials: Tutorial[] = [];
  publishedTutorials: Tutorial[] = [];
  draftTutorials: Tutorial[] = [];
  isLoading = true;

  constructor(
    private matrixNotesService: MatrixNotesService,
    public adminService: AdminService, // Changed to public
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadTutorials();
  }

  async loadTutorials() {
    try {
      this.isLoading = true;
      this.tutorials = await this.matrixNotesService.getAllTutorials();
      this.publishedTutorials = this.tutorials.filter(t => t.published);
      this.draftTutorials = this.tutorials.filter(t => !t.published);
    } catch (error) {
      console.error('Error loading tutorials:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteTutorial(tutorialId: string) {
    if (confirm('Are you sure you want to delete this tutorial?')) {
      try {
        await this.matrixNotesService.deleteTutorial(tutorialId);
        await this.loadTutorials(); // Reload the list
      } catch (error) {
        console.error('Error deleting tutorial:', error);
      }
    }
  }

  async togglePublish(tutorial: Tutorial) {
    try {
      if (tutorial.published) {
        await this.matrixNotesService.unpublishTutorial(tutorial.id);
      } else {
        await this.matrixNotesService.publishTutorial(tutorial.id);
      }
      await this.loadTutorials(); // Reload the list
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  }

  createNewTutorial() {
    this.router.navigate(['/admin/matrix-notes/editor']);
  }

  editTutorial(tutorialId: string) {
    this.router.navigate(['/admin/matrix-notes/editor', tutorialId]);
  }

  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  // Add missing method
  getTotalViews(): number {
    return this.tutorials.reduce((total, tutorial) => total + (tutorial.views || 0), 0);
  }
}