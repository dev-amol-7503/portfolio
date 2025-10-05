import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { Project, Testimonial, Skill, Experience, SocialPost } from '../../interfaces/social-post.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  isEditMode = false;
  activeTab = 'overview';
  portfolioData: any = {};
  private subscriptions: Subscription[] = [];

  // Form models
  newProject: Partial<Project> = {};
  newTestimonial: Partial<Testimonial> = {};
  newSkill: Partial<Skill> = {};
  newExperience: Partial<Experience> = {};
  newSocialPost: Partial<SocialPost> = {};

  constructor(
    private adminService: AdminService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.adminService.editMode$.subscribe(mode => {
        this.isEditMode = mode;
      }),
      this.adminService.portfolioData$.subscribe(data => {
        this.portfolioData = data;
      })
    );
  }

  toggleEditMode() {
    this.adminService.toggleEditMode();
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  logout() {
    this.adminService.logout();
    this.toastr.info('Logged out successfully');
    this.router.navigate(['/']);
  }

  // Project Methods
  addProject() {
    if (this.newProject.title && this.newProject.description) {
      const project: Project = {
        id: Date.now(),
        title: this.newProject.title!,
        description: this.newProject.description!,
        technologies: this.newProject.technologies || ['Angular'],
        imageUrl: this.newProject.imageUrl || 'assets/images/project-placeholder.jpg',
        link: this.newProject.link || '#',
        githubLink: this.newProject.githubLink,
        category: this.newProject.category || 'Web Application',
        featured: this.newProject.featured || false
      };
      this.adminService.addProject(project);
      this.newProject = {};
      this.toastr.success('Project added successfully');
    }
  }

  deleteProject(projectId: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.adminService.deleteProject(projectId);
      this.toastr.success('Project deleted successfully');
    }
  }

  // Testimonial Methods
  addTestimonial() {
    if (this.newTestimonial.name && this.newTestimonial.text) {
      const testimonial: Testimonial = {
        id: Date.now(),
        name: this.newTestimonial.name!,
        position: this.newTestimonial.position || 'Colleague',
        text: this.newTestimonial.text!,
        image: this.newTestimonial.image || 'assets/images/profile-user.png',
        rating: this.newTestimonial.rating || 5
      };
      this.adminService.addTestimonial(testimonial);
      this.newTestimonial = {};
      this.toastr.success('Testimonial added successfully');
    }
  }

  deleteTestimonial(testimonialId: number) {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      this.adminService.deleteTestimonial(testimonialId);
      this.toastr.success('Testimonial deleted successfully');
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}