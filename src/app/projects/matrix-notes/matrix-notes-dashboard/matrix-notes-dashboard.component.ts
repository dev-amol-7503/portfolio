import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { Tutorial } from '../../../interfaces/tutorial.model';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';

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
  isConnected = false;

  constructor(
    private matrixNotesService: MatrixNotesService,
    public adminService: AdminService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  async ngOnInit() {
    await this.loadTutorials();
  }

  async loadTutorials() {
    try {
      this.isLoading = true;

      // Test Firebase connection
      this.isConnected = await this.matrixNotesService.testFirebaseConnection();
      if (!this.isConnected) {
        this.toastr.error('Cannot connect to database');
        return;
      }

      this.tutorials = await this.matrixNotesService.getAllTutorials();
      this.publishedTutorials = this.tutorials.filter(t => t.published);
      this.draftTutorials = this.tutorials.filter(t => !t.published);

      console.log('📊 Loaded tutorials:', this.tutorials.length);
    } catch (error) {
      console.error('Error loading tutorials:', error);
      this.toastr.error('Failed to load tutorials');
    } finally {
      this.isLoading = false;
    }
  }

  async deleteTutorial(tutorialId: string) {
    if (confirm('Are you sure you want to delete this tutorial? This action cannot be undone.')) {
      try {
        await this.matrixNotesService.deleteTutorial(tutorialId);
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

  createNewTutorial() {
    this.router.navigate(['/admin/matrix-notes/editor']);
  }

  editTutorial(tutorialId: string) {
    this.router.navigate(['/admin/matrix-notes/editor', tutorialId]);
  }

  previewTutorial(tutorialId: string) {
    // Open tutorial in new tab for preview
    window.open(`/tutorials/${tutorialId}`, '_blank');
  }

  getTotalViews(): number {
    return this.tutorials.reduce((total, tutorial) => total + (tutorial.views || 0), 0);
  }

  getTotalLikes(): number {
    return this.tutorials.reduce((total, tutorial) => total + (tutorial.likes || 0), 0);
  }
}