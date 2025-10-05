import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsComponent } from '../components/stats/stats/stats.component';
import { TestimonialComponent } from '../components/testimonial/testimonial/testimonial.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, StatsComponent, TestimonialComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  title = 'Full Stack Developer';
}