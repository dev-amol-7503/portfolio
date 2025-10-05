import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsComponent } from '../components/stats/stats/stats.component';
import { TestimonialComponent } from '../components/testimonial/testimonial/testimonial.component';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, StatsComponent, TestimonialComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  title = 'Full Stack Developer';
  personalInfo: any = {};

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.personalInfo = data.personalInfo || {};
    });
  }
}