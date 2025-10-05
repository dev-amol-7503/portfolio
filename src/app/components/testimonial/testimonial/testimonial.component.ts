import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Testimonial } from '../../../interfaces/social-post.model';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-testimonial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial.component.html',
  styleUrls: ['./testimonial.component.scss']
})
export class TestimonialComponent implements OnInit {
  testimonials: Testimonial[] = [];
  isEditMode = false;

  // Number of testimonials to show initially
  initialVisibleCount = 3;
  
  // Flag to track if we're showing all testimonials
  showAll = false;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.testimonials = data.testimonials || [];
    });

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });
  }
  
  // Computed property to get currently visible testimonials
  get visibleTestimonials(): Testimonial[] {
    return this.showAll 
      ? this.testimonials 
      : this.testimonials.slice(0, this.initialVisibleCount);
  }

  // Toggle between showing all and showing only initial count
  toggleViewMore(): void {
    this.showAll = !this.showAll;
  }
}